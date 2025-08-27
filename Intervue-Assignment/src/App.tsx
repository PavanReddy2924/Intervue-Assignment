import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store';
import { 
  setConnected, 
  setUserType, 
  setCurrentPoll, 
  setTimeRemaining, 
  setResultsVisible,
  addPollResult,
  updateStudents,
  resetPoll
} from './store/pollSlice';
import { addMessage, setMessages } from './store/chatSlice';
import { Users, GraduationCap, Wifi, WifiOff } from 'lucide-react';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import SocketService from './utils/socket';

function App() {
  const dispatch = useDispatch();
  const { userType, isConnected } = useSelector((state: RootState) => state.poll);
  const socketService = SocketService.getInstance();

  useEffect(() => {
    const socket = socketService.connect();

    socket.on('connect', () => {
      dispatch(setConnected(true));
    });

    socket.on('disconnect', () => {
      dispatch(setConnected(false));
    });

    socket.on('poll-created', (poll) => {
      dispatch(setCurrentPoll(poll));
    });

    socket.on('poll-ended', (pollResult) => {
      dispatch(addPollResult(pollResult));
      dispatch(setResultsVisible(true));
      dispatch(resetPoll());
    });

    socket.on('poll-results', (pollResult) => {
      dispatch(addPollResult(pollResult));
    });

    socket.on('students-updated', (students) => {
      dispatch(updateStudents(students));
    });

    socket.on('time-update', (timeRemaining) => {
      dispatch(setTimeRemaining(timeRemaining));
    });

    socket.on('poll-timeout', (pollResult) => {
      dispatch(addPollResult(pollResult));
      dispatch(setResultsVisible(true));
    });

    socket.on('message-received', (message) => {
      dispatch(addMessage(message));
    });

    socket.on('chat-history', (messages) => {
      dispatch(setMessages(messages));
    });

    socket.on('kicked', () => {
      alert('You have been removed from the session by the teacher.');
      localStorage.removeItem('studentName');
      localStorage.removeItem('studentId');
      window.location.reload();
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('poll-created');
      socket.off('poll-ended');
      socket.off('poll-results');
      socket.off('students-updated');
      socket.off('time-update');
      socket.off('poll-timeout');
      socket.off('message-received');
      socket.off('chat-history');
      socket.off('kicked');
    };
  }, [dispatch, socketService]);

  const handleUserTypeSelection = (type: 'teacher' | 'student') => {
    dispatch(setUserType(type));
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
              Live Polling System
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Interactive real-time polling platform for teachers and students with live results and chat functionality.
            </p>
            <div className="flex items-center justify-center mt-6 space-x-2">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-medium">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-500" />
                  <span className="text-red-600 font-medium">Disconnected</span>
                </>
              )}
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div 
                onClick={() => handleUserTypeSelection('teacher')}
                className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl border-2 border-transparent hover:border-blue-500"
              >
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <GraduationCap className="w-10 h-10 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Teacher</h2>
                  <p className="text-gray-600 mb-6">
                    Create and manage live polls, view real-time results, and interact with students.
                  </p>
                  <ul className="text-left space-y-2 text-sm text-gray-600">
                    <li>• Create new polls with custom questions</li>
                    <li>• Configure time limits for responses</li>
                    <li>• View live polling results</li>
                    <li>• Manage student participants</li>
                    <li>• Access past poll results</li>
                    <li>• Chat with students</li>
                  </ul>
                </div>
              </div>

              <div 
                onClick={() => handleUserTypeSelection('student')}
                className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl border-2 border-transparent hover:border-purple-500"
              >
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Student</h2>
                  <p className="text-gray-600 mb-6">
                    Join live polling sessions, submit answers, and view real-time results.
                  </p>
                  <ul className="text-left space-y-2 text-sm text-gray-600">
                    <li>• Join with your name</li>
                    <li>• Answer poll questions</li>
                    <li>• View live results after voting</li>
                    <li>• Time-limited response windows</li>
                    <li>• Chat with teacher and peers</li>
                    <li>• Seamless session management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Features</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>🔄 Real-time polling</div>
                <div>💬 Live chat</div>
                <div>📊 Instant results</div>
                <div>⏰ Time limits</div>
                <div>👥 Student management</div>
                <div>📈 Past results</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userType === 'teacher') {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
}

export default App;
