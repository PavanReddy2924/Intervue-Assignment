import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setStudentInfo, setHasAnswered } from '../store/pollSlice';
import { Clock, CheckCircle, Users } from 'lucide-react';
import PollResults from './PollResults';
import ChatPopup from './ChatPopup';
import SocketService from '../utils/socket';
import { v4 as uuidv4 } from 'uuid';

const StudentDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    currentPoll, 
    studentName, 
    studentId, 
    timeRemaining, 
    hasAnswered, 
    isResultsVisible,
    students 
  } = useSelector((state: RootState) => state.poll);
  
  const [nameInput, setNameInput] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [showNameForm, setShowNameForm] = useState(!studentName);
  
  const socket = SocketService.getInstance().getSocket();

  useEffect(() => {
    if (studentName && studentId && socket) {
      socket.emit('join-as-student', { name: studentName, id: studentId });
    }
  }, [studentName, studentId, socket]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    
    const newStudentId = studentId || uuidv4();
    dispatch(setStudentInfo({ name: nameInput.trim(), id: newStudentId }));
    setShowNameForm(false);
    
    socket?.emit('join-as-student', { name: nameInput.trim(), id: newStudentId });
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || !currentPoll) return;
    
    socket?.emit('submit-answer', {
      pollId: currentPoll.id,
      answer: selectedOption,
      studentId,
      studentName,
    });
    
    dispatch(setHasAnswered(true));
    setSelectedOption('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showNameForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Welcome, Student!</h2>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your name to join the session
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Join Session
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {studentName}!
          </h1>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="font-medium">{students.length} Students Online</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {!currentPoll ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-gray-500 mb-4">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h2 className="text-xl font-semibold mb-2">Waiting for Teacher</h2>
                <p>Your teacher hasn't started a poll yet. Please wait...</p>
              </div>
            </div>
          ) : !currentPoll.isActive ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-gray-500 mb-4">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-xl font-semibold mb-2">Poll Ended</h2>
                <p>This poll has ended. Check the results below!</p>
              </div>
            </div>
          ) : hasAnswered || isResultsVisible ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-6">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2">Answer Submitted!</h2>
              <p className="text-gray-600">Thank you for your response. View the live results below.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Current Poll</h2>
                <div className="flex items-center space-x-2 text-red-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-mono text-lg font-bold">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">{currentPoll.question}</h3>
                <div className="space-y-3">
                  {currentPoll.options.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedOption === option
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="poll-option"
                        value={option}
                        checked={selectedOption === option}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="mr-3"
                      />
                      <span className="text-gray-800">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedOption}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  selectedOption
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Submit Answer
              </button>
            </div>
          )}

          {/* Show results if student has answered or poll ended */}
          {(hasAnswered || isResultsVisible || !currentPoll?.isActive) && currentPoll && (
            <PollResults />
          )}
        </div>
      </div>
      <ChatPopup />
    </div>
  );
};

export default StudentDashboard;