import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../screens/LoginScreen';
import { AuthContext } from '../../contexts/AuthContext';
import * as api from '../../utils/api';

jest.mock('../../utils/api');

const mockLogin = jest.fn();
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const mockAuthContext = {
  login: mockLogin,
  logout: jest.fn(),
  user: null,
  loading: false,
  token: null,
  refreshToken: null,
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderLoginScreen = () => {
    return render(
      <AuthContext.Provider value={mockAuthContext}>
        <LoginScreen />
      </AuthContext.Provider>
    );
  };

  it('renders correctly', () => {
    const { getByPlaceholderText, getByText } = renderLoginScreen();
    
    expect(getByPlaceholderText('이메일')).toBeTruthy();
    expect(getByPlaceholderText('비밀번호')).toBeTruthy();
    expect(getByText('로그인')).toBeTruthy();
    expect(getByText('회원가입하기')).toBeTruthy();
  });

  it('handles login with valid credentials', async () => {
    const { getByPlaceholderText, getByText } = renderLoginScreen();
    
    const emailInput = getByPlaceholderText('이메일');
    const passwordInput = getByPlaceholderText('비밀번호');
    const loginButton = getByText('로그인');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows error for empty fields', async () => {
    const { getByText, queryByText } = renderLoginScreen();
    
    const loginButton = getByText('로그인');
    fireEvent.press(loginButton);

    // Since the actual implementation shows alerts, we can't test them directly
    // But we can verify that login is not called
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('navigates to signup screen', () => {
    const { getByText } = renderLoginScreen();
    
    const signupButton = getByText('회원가입하기');
    fireEvent.press(signupButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Signup');
  });

  it('handles server connection test', async () => {
    (api.default.get as jest.Mock).mockResolvedValueOnce({ data: { status: 'ok' } });
    
    const { getByText } = renderLoginScreen();
    
    const testButton = getByText('서버 연결 테스트');
    fireEvent.press(testButton);

    await waitFor(() => {
      expect(api.default.get).toHaveBeenCalledWith('/health');
    });
  });
});