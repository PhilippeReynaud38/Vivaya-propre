import { ReactNode } from 'react';
interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement>{
  variant?: 'solid' | 'outline';
  children: ReactNode;
}
export default function Button({ variant='solid', children, ...props }:Props){
  const base = variant==='solid' ? 'btn' : 'btn-outline';
  return <button className={base} {...props}>{children}</button>;
}
