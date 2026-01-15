export const YeHaplessBuffoon = () => {
  return (
    <div className="shuffleCard border-red-900 text-white">
      <div
        className={`m-0 flex h-full flex-col items-center bg-gradient-to-bl from-aubergine to-aubergine-end p-0`}
      >
        <div
          className={`flex h-full flex-col items-center bg-black/30 p-2 font-semibold transition duration-200 ease-in-out hover:bg-transparent`}
        >
          <div>
            <div>⚠ IMPOTENT QUERIER DETECTED ⚠</div>
            <div>HALT! YOU'VE FOUND NO RESULTS!</div>
          </div>
          <img
            src="/assets/images/eb3dM.gif"
            alt="aaaaaaaaaa"
            className="h-28 w-28"
          />
          <div className="h-full w-full rounded-md bg-black bg-opacity-50 px-1 py-2">
            <div className="flex h-full flex-col justify-center leading-tight">
              <div>
                <p className="lore">
                  Please refine your search and/or yourself, ye hapless buffoon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
