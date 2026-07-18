"use client";

type Props = {
  targetId: string;
  children: React.ReactNode;
  className?: string;
};

export default function ScrollLink({ targetId, children, className }: Props) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(targetId)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <a href={`#${targetId}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}