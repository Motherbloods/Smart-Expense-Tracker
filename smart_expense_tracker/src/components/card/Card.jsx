// Card.jsx - Updated elegant version
import { DollarSign, TrendingUp, TrendingDown, Target, PiggyBank } from 'lucide-react';

function Card({ title, value, textColor, type }) {
    // Determine icon based on title or type
    const getIcon = () => {
        if (title.includes('Budget') || type === 'budget') return Target;
        if (title.includes('Pemasukan') || type === 'income') return TrendingUp;
        if (title.includes('Pengeluaran') || type === 'expense') return TrendingDown;
        if (title.includes('Saldo') || title.includes('Sisa') || type === 'balance') return PiggyBank;
        return DollarSign;
    };

    const Icon = getIcon();

    const getIconBg = () => {
        if (textColor.includes('blue')) return 'bg-blue-100';
        if (textColor.includes('green')) return 'bg-green-100';
        if (textColor.includes('red')) return 'bg-red-100';
        return 'bg-gray-100';
    };

    const getGradientBg = () => {
        if (textColor.includes('blue')) return 'from-blue-50 to-blue-100';
        if (textColor.includes('green')) return 'from-green-50 to-green-100';
        if (textColor.includes('red')) return 'from-red-50 to-red-100';
        return 'from-gray-50 to-gray-100';
    };

    return (
        <div className={`relative overflow-hidden bg-gradient-to-br ${getGradientBg()} p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-white/50 hover:scale-[1.02] group`}>
            {/* Subtle background pattern */}
            <div className="absolute -top-4 -right-4 w-16 h-16 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <div className={`w-full h-full bg-gradient-to-br ${textColor.includes('blue') ? 'from-blue-400 to-blue-600' :
                    textColor.includes('green') ? 'from-green-400 to-green-600' :
                        'from-red-400 to-red-600'} rounded-full`}></div>
            </div>

            <div className="relative">
                <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${getIconBg()} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-5 h-5 ${textColor}`} />
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-700 leading-tight">{title}</h3>
                    <p className={`text-2xl font-bold ${textColor} leading-none`}>
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Card;