import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);

// Dynamic CORS configuration to handle webcontainer environments
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost with any protocol
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow webcontainer-api.io domains
    if (origin.includes('webcontainer-api.io')) {
      return callback(null, true);
    }
    
    // Default fallback
    callback(null, true);
  },
  methods: ["GET", "POST"],
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions
});

app.use(cors(corsOptions));
app.use(express.json());

// In-memory storage
let currentPoll = null;
let students = new Map();
let pollResults = [];
let chatMessages = [];
let pollTimer = null;

// Helper functions
const getPollResult = (pollId) => {
  return pollResults.find(result => result.pollId === pollId);
};

const createPollResult = (poll) => {
  const result = {
    pollId: poll.id,
    question: poll.question,
    options: poll.options,
    votes: {},
    totalVotes: 0,
    responses: [],
    createdAt: poll.createdAt
  };
  
  // Initialize vote counts
  poll.options.forEach(option => {
    result.votes[option] = 0;
  });
  
  pollResults.push(result);
  return result;
};

const updatePollResult = (pollId, studentId, studentName, answer) => {
  let result = getPollResult(pollId);
  if (!result) {
    return null;
  }
  
  // Check if student already voted
  const existingResponseIndex = result.responses.findIndex(r => r.studentId === studentId);
  if (existingResponseIndex >= 0) {
    // Update existing response
    const oldAnswer = result.responses[existingResponseIndex].answer;
    result.votes[oldAnswer]--;
    result.responses[existingResponseIndex] = {
      studentId,
      studentName,
      answer,
      timestamp: Date.now()
    };
  } else {
    // Add new response
    result.responses.push({
      studentId,
      studentName,
      answer,
      timestamp: Date.now()
    });
  }
  
  // Update vote count
  result.votes[answer]++;
  result.totalVotes = result.responses.length;
  
  return result;
};

const endPoll = () => {
  if (currentPoll) {
    currentPoll.isActive = false;
    currentPoll.endTime = Date.now();
    
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    
    const result = getPollResult(currentPoll.id);
    if (result) {
      io.emit('poll-ended', result);
    }
    
    currentPoll = null;
  }
};

const startPollTimer = (poll) => {
  if (pollTimer) {
    clearTimeout(pollTimer);
  }
  
  const startTime = Date.now();
  const endTime = startTime + (poll.maxTime * 1000);
  
  // Send time updates every second
  const timeInterval = setInterval(() => {
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
    
    io.emit('time-update', remaining);
    
    if (remaining <= 0) {
      clearInterval(timeInterval);
      
      // End poll due to timeout
      const result = getPollResult(poll.id);
      if (result) {
        io.emit('poll-timeout', result);
      }
      endPoll();
    }
  }, 1000);
  
  // Set timer to end poll
  pollTimer = setTimeout(() => {
    clearInterval(timeInterval);
    const result = getPollResult(poll.id);
    if (result) {
      io.emit('poll-timeout', result);
    }
    endPoll();
  }, poll.maxTime * 1000);
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Send chat history to new user
  socket.emit('chat-history', chatMessages);
  
  socket.on('join-as-teacher', () => {
    socket.join('teachers');
    socket.userType = 'teacher';
    console.log('Teacher joined:', socket.id);
    
    // Send current poll if exists
    if (currentPoll) {
      socket.emit('poll-created', currentPoll);
    }
    
    // Send current students
    socket.emit('students-updated', Array.from(students.values()));
    
    // Send all poll results
    socket.emit('poll-results', pollResults);
  });
  
  socket.on('join-as-student', ({ name, id }) => {
    socket.join('students');
    socket.userType = 'student';
    socket.studentId = id;
    socket.studentName = name;
    
    // Add or update student
    students.set(id, {
      id,
      name,
      isOnline: true,
      joinedAt: Date.now(),
      socketId: socket.id
    });
    
    console.log('Student joined:', name, id);
    
    // Send current poll if exists
    if (currentPoll) {
      socket.emit('poll-created', currentPoll);
      
      // Send current time remaining
      if (currentPoll.isActive && currentPoll.startTime) {
        const elapsed = Date.now() - currentPoll.startTime;
        const remaining = Math.max(0, Math.floor((currentPoll.maxTime * 1000 - elapsed) / 1000));
        socket.emit('time-update', remaining);
      }
    }
    
    // Broadcast updated student list
    io.emit('students-updated', Array.from(students.values()));
    
    // Send poll results if available
    if (pollResults.length > 0) {
      socket.emit('poll-results', pollResults);
    }
  });
  
  socket.on('create-poll', (pollData) => {
    if (socket.userType !== 'teacher') return;
    
    const poll = {
      id: uuidv4(),
      question: pollData.question,
      options: pollData.options,
      maxTime: pollData.maxTime,
      isActive: true,
      createdAt: Date.now(),
      startTime: Date.now()
    };
    
    currentPoll = poll;
    
    // Create poll result structure
    createPollResult(poll);
    
    // Start timer
    startPollTimer(poll);
    
    // Broadcast to all users
    io.emit('poll-created', poll);
    
    console.log('Poll created:', poll.question);
  });
  
  socket.on('submit-answer', ({ pollId, answer, studentId, studentName }) => {
    if (socket.userType !== 'student') return;
    if (!currentPoll || currentPoll.id !== pollId || !currentPoll.isActive) return;
    
    const result = updatePollResult(pollId, studentId, studentName, answer);
    if (result) {
      // Broadcast updated results
      io.emit('poll-results', result);
      
      console.log('Answer submitted:', studentName, '->', answer);
      
      // Check if all students have answered
      const totalStudents = students.size;
      const totalResponses = result.responses.length;
      
      if (totalResponses >= totalStudents && totalStudents > 0) {
        // All students have answered, end poll
        setTimeout(() => {
          endPoll();
        }, 1000); // Small delay to show final results
      }
    }
  });
  
  socket.on('end-poll', () => {
    if (socket.userType !== 'teacher') return;
    endPoll();
  });
  
  socket.on('kick-student', (studentId) => {
    if (socket.userType !== 'teacher') return;
    
    const student = students.get(studentId);
    if (student) {
      // Find student's socket and disconnect
      const studentSocket = io.sockets.sockets.get(student.socketId);
      if (studentSocket) {
        studentSocket.emit('kicked');
        studentSocket.disconnect();
      }
      
      // Remove from students list
      students.delete(studentId);
      
      // Broadcast updated student list
      io.emit('students-updated', Array.from(students.values()));
      
      console.log('Student kicked:', student.name);
    }
  });
  
  socket.on('send-message', ({ message, sender, senderType }) => {
    const chatMessage = {
      id: uuidv4(),
      sender,
      senderType,
      message,
      timestamp: Date.now()
    };
    
    chatMessages.push(chatMessage);
    
    // Keep only last 100 messages
    if (chatMessages.length > 100) {
      chatMessages = chatMessages.slice(-100);
    }
    
    // Broadcast to all users
    io.emit('message-received', chatMessage);
    
    console.log('Message sent:', sender, '->', message);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove student if they disconnect
    if (socket.userType === 'student' && socket.studentId) {
      students.delete(socket.studentId);
      io.emit('students-updated', Array.from(students.values()));
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get current poll status
app.get('/api/poll/status', (req, res) => {
  res.json({
    currentPoll,
    studentsCount: students.size,
    resultsCount: pollResults.length
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});