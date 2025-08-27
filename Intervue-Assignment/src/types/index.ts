export interface Poll {
  id: string;
  question: string;
  options: string[];
  createdAt: number;
  maxTime: number;
  isActive: boolean;
  startTime?: number;
  endTime?: number;
}

export interface PollResult {
  pollId: string;
  question: string;
  options: string[];
  votes: { [option: string]: number };
  totalVotes: number;
  responses: PollResponse[];
  createdAt: number;
}

export interface PollResponse {
  studentId: string;
  studentName: string;
  answer: string;
  timestamp: number;
}

export interface Student {
  id: string;
  name: string;
  isOnline: boolean;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderType: 'teacher' | 'student';
  message: string;
  timestamp: number;
}

export interface AppState {
  currentPoll: Poll | null;
  pollResults: PollResult[];
  students: Student[];
  chatMessages: ChatMessage[];
  isConnected: boolean;
  userType: 'teacher' | 'student' | null;
  studentName: string | null;
  studentId: string | null;
  timeRemaining: number;
  hasAnswered: boolean;
  isResultsVisible: boolean;
}