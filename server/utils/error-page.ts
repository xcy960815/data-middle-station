import type { H3Event } from 'h3';

export const defineErrorPageHandler = (handler: (event: H3Event) => any) => {
  const _handler = async (event: H3Event) => {
    const response = await handler(event);
    console.log('response', response);

    return response;
  };

  return defineEventHandler(_handler);
};
