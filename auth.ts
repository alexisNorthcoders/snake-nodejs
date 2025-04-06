import axios from 'axios';

export const verifyTokenWithAuthServer = async (accessToken: string) => {
    try {
      const response = await axios.post('https://clipboard.duckdns.org/verify-token', {
        token: accessToken,
      });
      
      return response.data; 
    } catch (error) {
      console.error('Error verifying token', error);
    }
  };