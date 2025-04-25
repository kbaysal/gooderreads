"use client";

import { QueryClient, QueryClientConfig, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const defaultQueryClientOptions: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 60 * 60 * 1000
    }
  }
}

const queryClient = new QueryClient(defaultQueryClientOptions);

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}