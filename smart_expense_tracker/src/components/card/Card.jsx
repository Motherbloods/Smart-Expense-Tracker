function Card({ title, value, textColor }) {
    return (
        <div className="flex flex-col justify-between gap-2 bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition duration-300 ease-in-out w-full">
            <h1 className="text-gray-500 text-lg font-semibold tracking-wide">{title}</h1>
            <h1 className={`text-2xl font-bold ${textColor}`}>{value}</h1>
        </div>
    );
}

export default Card;
