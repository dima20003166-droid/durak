import { render, screen } from '@testing-library/react';
import LobbyScreen from '../pages/LobbyScreen';

window.HTMLElement.prototype.scrollIntoView = jest.fn();

jest.mock('../services/socketService', () => ({
  getServerUrl: jest.fn(() => 'http://localhost:4000'),
  getSocketId: jest.fn(() => 'socket-id'),
  joinRoom: jest.fn(),
  cancelRoom: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  sendMessage: jest.fn(),
}));

jest.mock('../components/ConfirmDialog', () => () => <div>ConfirmDialog</div>);
jest.mock('../components/AdminBadge', () => () => <div>AdminBadge</div>);

const noop = () => {};
const dummyUser = { username: 'Tester', id: 1, role: 'user', avatarUrl: '' };

test('renders create game button', () => {
  render(<LobbyScreen rooms={[]} setPage={noop} user={dummyUser} siteSettings={{}} />);
  expect(screen.getByText(/Создать игру/i)).toBeInTheDocument();
});
