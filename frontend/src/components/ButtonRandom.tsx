function ButtonRandom({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white transition-all duration-200 hover:cursor-pointer hover:bg-blue-700 active:scale-95"
    >
      🎲 Random Chat Now
    </button>
  )
}

export default ButtonRandom
