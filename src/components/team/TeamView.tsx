import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';
import TeamChat from './TeamChat';
import MembersList from './MembersList';
import InviteModal from './invite/InviteModal';

interface TeamData {
  id: string;
  name: string;
  bio: string;
  profileUrl: string;
  createdBy: string;
  createdAt: Date;
  members: Record<string, string>;
}

interface TeamMember {
  id: string;
  name: string;
  photoURL: string;
  role: string;
  lastActive?: Date;
}

const TeamView = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const fetchTeamAndMembers = async () => {
      if (!teamId || !auth.currentUser) {
        setError('Please sign in to view team details');
        setLoading(false);
        return;
      }

      try {
        // Fetch team data
        const teamDoc = await getDoc(doc(db, 'teams', teamId));
        if (!teamDoc.exists()) {
          setError('Team not found. Please check the team ID and try again.');
          setLoading(false);
          return;
        }

        const teamData = teamDoc.data();
        if (!teamData || !teamData.name || !teamData.members) {
          setError('Invalid team data structure');
          setLoading(false);
          return;
        }

        // Check if current user is a team member
        if (!teamData.members[auth.currentUser.uid]) {
          setError('You do not have permission to view this team');
          setLoading(false);
          return;
        }

        const formattedTeamData = {
          id: teamDoc.id,
          ...teamData,
          createdAt: teamData.createdAt?.toDate() || new Date()
        } as TeamData;
        setTeam(formattedTeamData);

        // Fetch team members
        const profilesRef = collection(db, 'profiles');
        const memberIds = Object.keys(formattedTeamData.members);
        
        if (memberIds.length === 0) {
          setMembers([]);
          setLoading(false);
          return;
        }

        const membersQuery = query(profilesRef, where('uid', 'in', memberIds));
        const membersSnapshot = await getDocs(membersQuery);

        const membersData = membersSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().displayName || 'Anonymous',
          photoURL: doc.data().photoURL || '',
          role: formattedTeamData.members[doc.id] || 'member',
          lastActive: doc.data().lastActive?.toDate()
        }));

        setMembers(membersData);
      } catch (err: any) {
        console.error('Error fetching team data:', err);
        setError(err.message || 'Failed to load team data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamAndMembers();
  }, [teamId]);

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">Please sign in to view team details</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <div className="text-red-500 dark:text-red-400">{error || 'Team not found'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="h-[calc(100vh-3.5rem)] flex">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700/30">
            {/* Team Header */}
            <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700/30 p-4 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex-shrink-0">
                {team.profileUrl ? (
                  <img
                    src={team.profileUrl}
                    alt={team.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {team.name}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {Object.keys(team.members).length} members
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                  onClick={() => navigate(`/teams/${teamId}/meet`)}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                  onClick={() => setShowInviteModal(true)}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                  onClick={() => setShowMembers(!showMembers)}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <TeamChat teamId={teamId!} />
          </div>

          {/* Members Sidebar */}
          {showMembers && (
            <div className="w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-700/30 bg-white dark:bg-gray-900/40 backdrop-blur-xl">
              <MembersList teamId={teamId!} members={members} />
            </div>
          )}

          {/* Invite Modal */}
          {showInviteModal && (
            <InviteModal
              teamId={teamId!}
              teamName={team.name}
              onClose={() => setShowInviteModal(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamView;
