"use client";

import {
  useCreativeStore,
  Header,
  ModeSwitcher,
  Gallery,
  GalleryModal,
  EditMode,
  GenerateMode,
  VideoMode,
} from '@/features/creative';

function App() {
  const { mode } = useCreativeStore();

  const renderModeContent = () => {
    switch (mode) {
      case 'EDIT':
        return <EditMode />;
      case 'GENERATE':
        return <GenerateMode />;
      case 'VIDEO':
        return <VideoMode />;
    }
  };

  return (
    <>
      <Header />
      <ModeSwitcher />

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {renderModeContent()}
      </main>

      <Gallery />
      <GalleryModal />
    </>
  );
}

export default App;
