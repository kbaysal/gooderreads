'use server';

import { headers } from 'next/headers';
 
export default async function NotFound() {
  const headersList = await headers()
  const domain = headersList.get('host')
  console.log(domain, headersList.get(':path:'));
  return (
    <div>
      <h2>Not found</h2>
    </div>
  )
}