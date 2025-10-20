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
            <th className="border px-4 py-3 text-left w-16">#</th>
            <th className="border px-4 py-3 text-left">Image</th>
            <th className="border px-4 py-3 text-left">Last Name</th>
            <th className="border px-4 py-3 text-left">Middle Name</th>
            <th className="border px-4 py-3 text-left">First Name</th>
            <th className="border px-4 py-3 text-left">Email</th>
            <th className="border px-4 py-3 text-left">Phone</th>
            <th className="border px-4 py-3 text-left">Birth Date</th>
          </tr>
          </thead>
          <tbody>
          {students.map((student, index) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="border px-4 py-3 text-gray-500">{index + 1}</td>
                <td className="border px-4 py-3">{student.image || 'No Image'}</td>
                {(() => {
                  const nameParts = student.name.trim().split(/\s+/);
                  const lastName = nameParts[0] || '';
                  const firstName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
                  const middleName = nameParts.length > 2
                      ? nameParts.slice(1, nameParts.length - 1).join(' ')
                      : nameParts.length === 2 ? '' : '';

                  return (
                      <>
                        <td className="border px-4 py-3 font-semibold text-blue-700">
                          {lastName}
                        </td>
                        <td className="border px-4 py-3 font-semibold text-blue-700">
                          {middleName}
                        </td>
                        <td className="border px-4 py-3 font-semibold text-blue-700">
                          {firstName}
                        </td>
                      </>
                  );
                })()}
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