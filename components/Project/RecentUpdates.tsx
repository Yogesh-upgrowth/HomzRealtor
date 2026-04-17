"use client";

type RecentUpdatesProps = {
  title: string;
  updates: string[];
};

const RecentUpdates = ({ title, updates }: RecentUpdatesProps) => {
  return (
    <div className="max-w-7xl mx-auto w-full bg-gray-100 border border-white my-10 rounded-xl p-5 sm:p-6 h-full flex flex-col">
      
      {/* Title */}
      <h2 className="bg-gradient-to-b from-[#FDF094] to-[#B77D2B] bg-clip-text text-transparent font-bold text-2xl mb-3">
        {title + " - Recent Updates"}
      </h2>

      {/* Divider */}
      <div className="border-b border-gray-200 mb-4" />

      {/* Updates List */}
      <div className="flex-1 relative overflow-hidden">
        
        <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm sm:text-[15px] leading-6 sm:leading-7">
          {updates.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RecentUpdates;