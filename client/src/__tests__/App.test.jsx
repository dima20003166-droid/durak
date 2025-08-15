import { render, screen } from '@testing-library/react';
import App from '../App';

jest.mock('../services/socketService', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  getSocketId: jest.fn(),
  joinRoom: jest.fn(),
}));

jest.mock('../pages/AuthScreen', () => () => <div>Auth Screen</div>);
jest.mock('../pages/LobbyScreen', () => () => <div>Lobby Screen</div>);
jest.mock('../pages/GameScreen', () => () => <div>Game Screen</div>);
jest.mock('../pages/ProfileScreen', () => () => <div>Profile Screen</div>);
jest.mock('../pages/WalletScreen', () => () => <div>Wallet Screen</div>);
jest.mock('../pages/LeaderboardScreen', () => () => <div>Leaderboard Screen</div>);
jest.mock('../pages/AdminPanel', () => () => <div>Admin Panel</div>);

test('renders Auth Screen by default', () => {
  render(<App />);
  expect(screen.getByText(/Auth Screen/i)).toBeInTheDocument();
});
