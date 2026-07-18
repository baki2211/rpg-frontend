import React, { ReactNode } from 'react';

interface HeaderSectionProps {
  title: ReactNode;
  titleAs?: 'h1' | 'h2';
  subtitle?: ReactNode;
  children?: ReactNode;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ title, titleAs: Title = 'h1', subtitle, children }) => (
  <div className="page-header">
    <Title>{title}</Title>
    {subtitle && <p>{subtitle}</p>}
    {children}
  </div>
);

export default HeaderSection;
