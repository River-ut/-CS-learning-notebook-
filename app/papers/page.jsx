import PaperLibrary from './paper-library';
import './papers.css';

export const metadata = { title: '论文库 · 个人学习工作台' };

export default function PapersPage() {
  const workspace = process.env.NODE_ENV === 'development' ? '/app' : '/app.html';
  return <PaperLibrary workspace={workspace} />;
}
