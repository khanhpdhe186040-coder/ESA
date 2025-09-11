import React from 'react';

const StudentList = ({ students }) => {
  if (!students || students.length === 0) {
    return (
      <div className="text-gray-500 text-center py-10">
        No students found in this class.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-3 text-left">Name</th>
            <th className="border px-4 py-3 text-left">Email</th>
            <th className="border px-4 py-3 text-left">Phone</th>
            <th className="border px-4 py-3 text-left">Birth Date</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-gray-50">
              <td className="border px-4 py-3 font-semibold text-blue-700">
                {student.name}
              </td>
              <td className="border px-4 py-3">{student.email}</td>
              <td className="border px-4 py-3">{student.number}</td>
              <td className="border px-4 py-3">{student.birthday}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentList;