import React, { useState } from 'react';
import axios from 'axios';

const Grades = ({ grades, onGradeUpdate }) => {
  const [editingGrade, setEditingGrade] = useState(null);
  const [formData, setFormData] = useState({
    listening: 0,
    reading: 0,
    writing: 0,
    speaking: 0,
    comment: ''
  });
  const [loading, setLoading] = useState(false);

  if (!grades || grades.length === 0) {
    return (
      <div className="text-gray-500 text-center py-10">
        No grades available for this class.
      </div>
    );
  }

  const calculateAverage = (score) => {
    if (!score || typeof score !== 'object') return 0;
    const scores = [score.listening, score.reading, score.writing, score.speaking];
    const validScores = scores.filter(s => s !== null && s !== undefined && !isNaN(s));
    if (validScores.length === 0) return 0;
    const average = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
    return average.toFixed(1);
  };

  const getGradeColor = (average) => {
    if (average >= 8) return "text-green-600 bg-green-100";
    if (average >= 6.5) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const handleEditClick = (grade) => {
    setEditingGrade(grade.id);
    setFormData({
      listening: grade.score?.listening || 0,
      reading: grade.score?.reading || 0,
      writing: grade.score?.writing || 0,
      speaking: grade.score?.speaking || 0,
      comment: grade.comment || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'comment' ? value : parseFloat(value) || 0
    }));
  };

  const handleSave = async (gradeId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        score: {
          listening: formData.listening,
          reading: formData.reading,
          writing: formData.writing,
          speaking: formData.speaking
        },
        comment: formData.comment
      };

      const response = await axios.patch(
        `http://localhost:9999/api/teacher/grades/${gradeId}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Call parent component's update function if provided
        if (onGradeUpdate) {
          onGradeUpdate();
        }
        setEditingGrade(null);
        alert('Grade updated successfully!');
      }
    } catch (error) {
      console.error('Error updating grade:', error);
      alert('Failed to update grade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingGrade(null);
    setFormData({
      listening: 0,
      reading: 0,
      writing: 0,
      speaking: 0,
      comment: ''
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-3 text-left">Student</th>
            <th className="border px-4 py-3 text-center">Listening</th>
            <th className="border px-4 py-3 text-center">Reading</th>
            <th className="border px-4 py-3 text-center">Writing</th>
            <th className="border px-4 py-3 text-center">Speaking</th>
            <th className="border px-4 py-3 text-center">Average</th>
            <th className="border px-4 py-3 text-left">Comment</th>
            <th className="border px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => {
            const average = calculateAverage(grade.score);
            const isEditing = editingGrade === grade.id;
            
            return (
              <tr key={grade.id} className="hover:bg-gray-50">
                <td className="border px-4 py-3 font-semibold text-blue-700">
                  {grade.student.name}
                </td>
                
                {/* Listening Score */}
                <td className="border px-4 py-3 text-center">
                  {isEditing ? (
                    <input
                      type="number"
                      name="listening"
                      value={formData.listening}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      step="0.1"
                      className="w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    grade?.score?.listening || 0
                  )}
                </td>
                
                {/* Reading Score */}
                <td className="border px-4 py-3 text-center">
                  {isEditing ? (
                    <input
                      type="number"
                      name="reading"
                      value={formData.reading}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      step="0.1"
                      className="w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    grade?.score?.reading || 0
                  )}
                </td>
                
                {/* Writing Score */}
                <td className="border px-4 py-3 text-center">
                  {isEditing ? (
                    <input
                      type="number"
                      name="writing"
                      value={formData.writing}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      step="0.1"
                      className="w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    grade?.score?.writing || 0
                  )}
                </td>
                
                {/* Speaking Score */}
                <td className="border px-4 py-3 text-center">
                  {isEditing ? (
                    <input
                      type="number"
                      name="speaking"
                      value={formData.speaking}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      step="0.1"
                      className="w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    grade?.score?.speaking || 0
                  )}
                </td>
                
                {/* Average */}
                <td className="border px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded font-medium ${getGradeColor(average)}`}>
                    {average || '0.0'}
                  </span>
                </td>
                
                {/* Comment */}
                <td className="border px-4 py-3">
                  {isEditing ? (
                    <textarea
                      name="comment"
                      value={formData.comment}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="Enter comment..."
                    />
                  ) : (
                    grade.comment || <span className="text-gray-400 italic">No comment</span>
                  )}
                </td>
                
                {/* Actions */}
                <td className="border px-4 py-3 text-center">
                  {isEditing ? (
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleSave(grade.id)}
                        disabled={loading}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditClick(grade)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Update
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Grades;