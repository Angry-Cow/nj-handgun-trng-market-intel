export const HeroBackground = () => {
  return (
    <div className="absolute box-border caret-transparent opacity-30 z-0 inset-0">
      <video
        autoplay=""
        loop=""
        playsinline=""
        className="box-border caret-transparent h-full max-w-full object-cover w-full"
      >
        <source
          src="https://cdn.pixabay.com/video/2025/07/23/293079_medium.mp4"
          type="video/mp4"
          className="text-black box-border caret-transparent leading-[normal] font-times_new_roman"
        />
      </video>
    </div>
  );
};
