import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { Plus, Users, Clock, Ban } from 'lucide-react';
import PollResults from './PollResults';
import ChatPopup from './ChatPopup';
import SocketService from '../utils/socket';

const TeacherDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { currentPoll, students } = useSelector((state: RootState) => state.poll);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [maxTime, setMaxTime] = useState(60);

  const socket = SocketService.getInstance().getSocket();

  useEffect(() => {
    if (socket) {
      socket.emit('join-as-teacher');
    }
  }, [socket]);

  const canCreatePoll = () => {
    return !currentPoll || (currentPoll && !currentPoll.isActive);
  };

  const handleCreatePoll = () => {
    if (!question.trim() || options.filter(opt => opt.trim()).length < 2) {
      alert('Please provide a question and at least 2 options');
      return;
    }

    const pollData = {
      question: question.trim(),
      options: options.filter(opt => opt.trim()),
      maxTime,
    };

    socket?.emit('create-poll', pollData);
    setShowCreatePoll(false);
    setQuestion('');
    setOptions(['', '']);
    setMaxTime(60);
  };

  const handleEndPoll = () => {
    socket?.emit('end-poll');
  };

  const handleKickStudent = (studentId: string) => {
    socket?.emit('kick-student', studentId);
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium">{students.length} Students Online</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Create Poll Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Poll Management</h2>
                {canCreatePoll() && (
                  <button
                    onClick={() => setShowCreatePoll(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create New Poll</span>
                  </button>
                )}
              </div>

              {currentPoll && currentPoll.isActive && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-green-800 mb-2">Active Poll</h3>
                      <p className="text-green-700">{currentPoll.question}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">{currentPoll.maxTime}s max time</span>
                      </div>
                    </div>
                    <button
                      onClick={handleEndPoll}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      End Poll
                    </button>
                  </div>
                </div>
              )}

              {!canCreatePoll() && currentPoll && currentPoll.isActive && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    Wait for all students to answer or end the current poll to create a new one.
                  </p>
                </div>
              )}
            </div>

            {/* Create Poll Form */}
            {showCreatePoll && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Create New Poll</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question
                    </label>
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Enter your poll question..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {options.length > 2 && (
                          <button
                            onClick={() => removeOption(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addOption}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Option
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Limit (seconds)
                    </label>
                    <input
                      type="number"
                      value={maxTime}
                      onChange={(e) => setMaxTime(parseInt(e.target.value) || 60)}
                      min="10"
                      max="300"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleCreatePoll}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Poll
                    </button>
                    <button
                      onClick={() => setShowCreatePoll(false)}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Current Poll Results */}
            {currentPoll && (
              <PollResults />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Online Students</h3>
              {students.length === 0 ? (
                <p className="text-gray-500">No students online</p>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-500">
                          Joined {new Date(student.joinedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleKickStudent(student.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Kick student"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ChatPopup />
    </div>
  );
};

export default TeacherDashboard;
