import Image from "next/image";
// type Specification = {
//   projectType: string;
//   bedrooms: string;
//   totalunits: string;
//   developmentSize: string;
// };
type Specification = {
  icon: string;
  label: string;
  value: string;
};

interface HomeCardProps {
  imgUrl: string;
  location: string;
  reranumber: string;
  title: string;
  specifications: Specification[];
  btntag: string;
}

const HomesCard: React.FC<HomeCardProps> = ({
  imgUrl,
  location,
  reranumber,
  title,
  specifications,
  btntag,
}) => {
  return (
    <div
      className="w-full rounded-lg overflow-hidden shadow-sm bg-white transition-all duration-300 ease-in-out 
             hover:shadow-xl/30 hover:-translate-y-1 hover:scale-[1.02]"
    >
      {/* --- Row 1: Image --- */}
      <div className="relative w-full h-[230px] md:w-[622px] md:h-[304px] ">
        <Image
          src={imgUrl}
          alt="Luxury apartment building"
          fill
          className="object-cover"
        />
      </div>
      {/* --- Location & RERA --- */}
      <div className="flex flex-row py-2 pl-1 justify-start space-x-2">
        {/* location icon */}
        <div className="flex items-center bg-gray-800 text-white text-sm rounded-sm px-2 py-1 mx-1.5">
          <Image
            src={"/location.svg"}
            alt={"location icon"}
            width={16}
            height={16}
          />
          <span className="ml-1.5">{location}</span>
        </div>
        {/* RERA Tag */}
        <div className="flex items-center bg-gray-700 text-white text-xs font-semibold rounded-md px-3 py-1">
          Rera No. <span className="ml-1.5">{reranumber}</span>
        </div>
      </div>

      {/* Specificatins */}
      <div className="p-4">
        <h2 className="text-xl font-semibold text-[#212121] mb-4">{title}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {specifications.map((spec, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Image
                src={spec.icon}
                alt={`${spec.label} icon`}
                width={32}
                height={32}
                className="h-[25px] w-[25px] md:h-[32px] md:w-[32px] mr-4"
              />
              <div>
                <p className="text-[12px] md:text-[14px] text-[#212121]">
                  {spec.label}
                </p>
                <p className="text-[13px] md:text-[15px] font-semibold text-[#CEA44E]">
                  {spec.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Row 4  */}
      <hr className="bg-gradient-to-r from-[#E4C66D] via-[#B67F2C] to-[#E4C66D] h-1" />
      <div className="flex justify-between items-center p-2 md:p-3">
        <button className="text-[13px] md:text-[16px] bg-gradient-to-r from-[#E4C66D] via-[#B67F2C] to-[#E4C66D] text-white font-bold py-1 px-1.5 md:px-3 rounded-sm h-[35px] md:h-[43px]">
          {btntag}
        </button>

        {/* Icon buttons */}
        <div className="flex space-x-2">
          <button className="p-2 border-2 border-[#CEA44E] rounded-lg text-lg cursor-pointer">
            <Image
              src={"/icons/icon1.svg"}
              alt="Contact Icon"
              height={23}
              width={23}
              className="w-[16px] h-[16px] md:w-[23px] md:h-[23px]"
            />
          </button>
          <button className="p-2 border-2 border-[#CEA44E] rounded-lg text-lg cursor-pointer">
            <Image
              src={"/icons/icon.svg"}
              alt="Contact Icon"
              height={23}
              width={23}
              className="w-[16px] h-[16px] md:w-[23px] md:h-[23px]"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomesCard;
