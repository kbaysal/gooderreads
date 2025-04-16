"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function Redirect(props: { to: string, condition?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (props.condition) {
      router.push(props.to);
    }
  }, [props.condition, props.to, router]);

  return null;
}

export default Redirect;