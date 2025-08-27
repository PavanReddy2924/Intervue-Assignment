import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { BarChart3, Users, Clock } from 'lucide-react';

const PollResults: React.FC = () => {
  const { pollResults, currentPoll } = useSelector((state: RootState) => state.poll);
  
  if (!currentPoll) return null;
  
  const currentResult = pollResults.find(result => result.pollId === currentPoll.id);
  
  if (!currentResult) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 mt-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Poll Results</h2>
        </div>
        <p className="text-gray-500">No responses yet...</p>
      </div>
    );
  }

  const maxVotes = Math.max(...Object.values(currentResult.votes));

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Live Results</h2>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{currentResult.totalVotes} votes</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{new Date(currentResult.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{currentResult.question}</h3>
      </div>

      <div className="space-y-4">
        {currentResult.options.map((option, index) => {
          const votes = currentResult.votes[option] || 0;
          const percentage = currentResult.totalVotes > 0 ? (votes / currentResult.totalVotes) * 100 : 0;
          const isWinning = votes === maxVotes && votes > 0;
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`font-medium ${isWinning ? 'text-green-700' : 'text-gray-700'}`}>
                  {option}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                  <span className="text-sm text-gray-600">({votes} votes)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    isWinning ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Responses */}
      {currentResult.responses.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Responses</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {currentResult.responses
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 10)
              .map((response) => (
                <div key={`${response.studentId}-${response.timestamp}`} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{response.studentName}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">{response.answer}</span>
                    <span className="text-gray-400">
                      {new Date(response.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PollResults;