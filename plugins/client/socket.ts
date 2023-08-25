import { io } from 'socket.io-client';

/**
 * @desc socket 客户端
 * @returns {void}
 */
export default defineNuxtPlugin(() => {
  return {
    provide: {
      io: io,
    },
  };
});
