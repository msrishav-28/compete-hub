import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCompetition } from '../api/competitions';

export default function CompetitionDetailPage() {
  const { id } = useParams();
  const { data: competition, isLoading, error } = useQuery(
    ['competition', id],
    () => fetchCompetition(id!)
  );

  if (isLoading) return <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>;
  
  if (error) return <div className="text-red-500 text-center p-4">
    Error loading competition details. Please try again later.
  </div>;

  if (!competition) return <div className="text-center p-4">Competition not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">{competition.title}</h1>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {competition.platform}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {competition.category}
            </span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              {competition.difficulty}
            </span>
          </div>

          <div className="prose max-w-none mb-6">
            <p className="text-gray-700">{competition.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Event Details</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-gray-500 w-32">Starts:</span>
                  <span>{new Date(competition.startDate).toLocaleDateString()}</span>
                </li>
                {competition.endDate && (
                  <li className="flex items-center">
                    <span className="text-gray-500 w-32">Ends:</span>
                    <span>{new Date(competition.endDate).toLocaleDateString()}</span>
                  </li>
                )}
                {competition.teamSize && (
                  <li className="flex items-center">
                    <span className="text-gray-500 w-32">Team Size:</span>
                    <span>{competition.teamSize}</span>
                  </li>
                )}
                <li className="flex items-center">
                  <span className="text-gray-500 w-32">Time Commitment:</span>
                  <span className="capitalize">{competition.timeCommitment}</span>
                </li>
              </ul>
            </div>

            {competition.prize && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Prize</h3>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">
                    {competition.prize.value} {competition.prize.currency}
                  </div>
                </div>
              </div>
            )}
          </div>

          {competition.tags && competition.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {competition.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <a
              href={competition.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Visit Competition Page
              <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
