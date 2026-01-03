// src/components/ReaderModes.tsx
export const ReaderModes = () => {
  const [mode, setMode] = useState<'vertical' | 'horizontal' | 'webtoon'>('vertical');
  
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <select 
        value={mode}
        onChange={(e) => setMode(e.target.value as any)}
        className="glass px-4 py-2 rounded-lg"
      >
        <option value="vertical">Vertical Scroll</option>
        <option value="horizontal">Horizontal Flip</option>
        <option value="webtoon">Webtoon Mode</option>
      </select>
    </div>
  );
};
