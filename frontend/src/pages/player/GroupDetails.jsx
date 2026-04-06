import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import { fetchGroupById, joinGroup, postGroupMessage } from '../../services/groupService';

export default function GroupDetails() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [chatText, setChatText] = useState('');

  const loadGroup = async () => {
    try {
      setError('');
      const response = await fetchGroupById(groupId);
      setGroup(response.group);
      setMembers(response.members);
      setMessages(response.messages || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const handleJoin = async () => {
    try {
      const response = await joinGroup(groupId);
      setMessage(response.message);
      await loadGroup();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    try {
      setError('');
      const response = await postGroupMessage(groupId, chatText);
      setMessages((current) => [...current, {
        ...response.message,
        sender_name: user.fullName,
        sender_username: user.username,
      }]);
      setChatText('');
      setMessage('Message sent.');
      await loadGroup();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!group && !error) {
    return <div className="page-shell"><p>Loading group...</p></div>;
  }

  if (error && !group) {
    return <div className="page-shell"><p className="form-error">{error}</p></div>;
  }

  return (
    <div className="page-shell">
      <div className="dashboard-grid group-layout">
        <Card
          title={group.name}
          subtitle={`${group.sport_type} • ${group.city} • ${group.skill_level}`}
          actions={<Link className="text-link" to="/profile">Back to profile</Link>}
        >
          <p>{group.description || 'No group description yet.'}</p>
          <div className="stats-row">
            <div className="stat-box">
              <span>Members</span>
              <strong>{group.member_count}/{group.max_members}</strong>
            </div>
            <div className="stat-box">
              <span>Created by</span>
              <strong>{group.creator_name}</strong>
            </div>
          </div>
          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          {user?.role === 'player' && !group.is_member && group.member_count < group.max_members && (
            <Button className="inline-button-gap" onClick={handleJoin}>Join this group</Button>
          )}
          {group.is_member && <p className="group-note">You are a member of this group.</p>}
          {group.member_count >= group.max_members && !group.is_member && (
            <p className="group-note">This group has reached its member limit.</p>
          )}
        </Card>

        <Card title="Members" subtitle="Players currently in this group.">
          {members.map((member) => (
            <div className="list-item" key={member.id}>
              <strong>{member.full_name}</strong>
              <span>{member.member_role === 'captain' ? 'Captain' : 'Member'}</span>
              <span>{member.primary_sport} • {member.skill_level} • {member.city}</span>
            </div>
          ))}
          {members.length === 0 && <p>No members yet.</p>}
        </Card>

        <Card title="Group chat" subtitle={group.is_member ? 'Coordinate sessions with the group here.' : 'Join the group to unlock the chat.'}>
          {group.is_member ? (
            <>
              <div className="chat-list">
                {messages.map((chatMessage) => (
                  <div className="chat-bubble" key={chatMessage.id}>
                    <strong>{chatMessage.sender_name}</strong>
                    <span>{chatMessage.message_text}</span>
                    <small>{new Date(chatMessage.created_at).toLocaleString()}</small>
                  </div>
                ))}
                {messages.length === 0 && <p>No messages yet. Start the conversation.</p>}
              </div>
              <form className="grid-form chat-form" onSubmit={handleSendMessage}>
                <textarea
                  className="chat-input"
                  rows="4"
                  placeholder="Write a message to the group..."
                  value={chatText}
                  onChange={(event) => setChatText(event.target.value)}
                  required
                />
                <Button type="submit">Send message</Button>
              </form>
            </>
          ) : (
            <p className="group-note">Only group members can read and post messages.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
