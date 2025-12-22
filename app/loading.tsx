export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center">
      <div className="w-32 animate-pulse">
        <img src="/logo.png" alt="Loading..." className="w-full h-auto object-contain" />
      </div>
    </div>
  );
}