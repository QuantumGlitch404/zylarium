import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRightLeft, Ruler, Box, Scale, Timer, Zap, CloudLightning, Database, Globe, Calculator, History, Trash2, Settings, Info, Copy, Check, ChevronRight } from 'lucide-react';
import GlassSelect from '../../components/ui/GlassSelect';

// --- Types & Constants ---

type UnitCategory =
    | 'Length' | 'Area' | 'Volume' | 'Mass' | 'Speed'
    | 'Time' | 'Temperature' | 'Energy' | 'Power' | 'Pressure'
    | 'Frequency' | 'Data' | 'Angle';

interface UnitDef {
    id: string;
    name: string;
    symbol: string;
    ratio: number; // Ratio to base unit
    offset?: number; // For temperature (e.g. Kelvin/Fahrenheit)
    base?: boolean;
}

interface CategoryDef {
    id: UnitCategory;
    name: string;
    icon: React.ReactNode;
    baseUnit: string;
    units: UnitDef[];
}

interface ConversionHistoryItem {
    id: string;
    fromVal: string;
    fromUnit: string;
    toVal: string;
    toUnit: string;
    category: UnitCategory;
    timestamp: number;
}

// --- Conversion Data ---

const CATEGORIES: CategoryDef[] = [
    {
        id: 'Length',
        name: 'Length & Distance',
        icon: <Ruler className="w-5 h-5" />,
        baseUnit: 'Meter',
        units: [
            { id: 'm', name: 'Meter', symbol: 'm', ratio: 1, base: true },
            { id: 'km', name: 'Kilometer', symbol: 'km', ratio: 1000 },
            { id: 'cm', name: 'Centimeter', symbol: 'cm', ratio: 0.01 },
            { id: 'mm', name: 'Millimeter', symbol: 'mm', ratio: 0.001 },
            { id: 'um', name: 'Micrometer', symbol: 'µm', ratio: 1e-6 },
            { id: 'nm', name: 'Nanometer', symbol: 'nm', ratio: 1e-9 },
            { id: 'mi', name: 'Mile', symbol: 'mi', ratio: 1609.344 },
            { id: 'yd', name: 'Yard', symbol: 'yd', ratio: 0.9144 },
            { id: 'ft', name: 'Foot', symbol: 'ft', ratio: 0.3048 },
            { id: 'in', name: 'Inch', symbol: 'in', ratio: 0.0254 },
            { id: 'nmi', name: 'Nautical Mile', symbol: 'nmi', ratio: 1852 },
            { id: 'au', name: 'Astronomical Unit', symbol: 'AU', ratio: 149597870700 },
            { id: 'ly', name: 'Light Year', symbol: 'ly', ratio: 9.4607e15 },
        ]
    },
    {
        id: 'Area',
        name: 'Area',
        icon: <Box className="w-5 h-5" />,
        baseUnit: 'Square Meter',
        units: [
            { id: 'sqm', name: 'Square Meter', symbol: 'm²', ratio: 1, base: true },
            { id: 'sqkm', name: 'Square Kilometer', symbol: 'km²', ratio: 1e6 },
            { id: 'sqcm', name: 'Square Centimeter', symbol: 'cm²', ratio: 0.0001 },
            { id: 'sqmm', name: 'Square Millimeter', symbol: 'mm²', ratio: 1e-6 },
            { id: 'ha', name: 'Hectare', symbol: 'ha', ratio: 10000 },
            { id: 'ac', name: 'Acre', symbol: 'ac', ratio: 4046.8564224 },
            { id: 'sqmi', name: 'Square Mile', symbol: 'mi²', ratio: 2.58999e6 },
            { id: 'sqft', name: 'Square Foot', symbol: 'ft²', ratio: 0.092903 },
            { id: 'sqin', name: 'Square Inch', symbol: 'in²', ratio: 0.00064516 },
        ]
    },
    {
        id: 'Volume',
        name: 'Volume',
        icon: <Box className="w-5 h-5" />, // Reusing Box or Cube equivalent
        baseUnit: 'Cubic Meter',
        units: [
            { id: 'cum', name: 'Cubic Meter', symbol: 'm³', ratio: 1, base: true },
            { id: 'l', name: 'Liter', symbol: 'L', ratio: 0.001 },
            { id: 'ml', name: 'Milliliter', symbol: 'mL', ratio: 1e-6 },
            { id: 'gal_us', name: 'Gallon (US)', symbol: 'gal', ratio: 0.00378541 },
            { id: 'qt_us', name: 'Quart (US)', symbol: 'qt', ratio: 0.000946353 },
            { id: 'pt_us', name: 'Pint (US)', symbol: 'pt', ratio: 0.000473176 },
            { id: 'cup', name: 'Cup (US)', symbol: 'cup', ratio: 0.000236588 },
            { id: 'floz_us', name: 'Fluid Ounce (US)', symbol: 'fl oz', ratio: 2.9574e-5 },
            { id: 'tbsp', name: 'Tablespoon (US)', symbol: 'tbsp', ratio: 1.4787e-5 },
            { id: 'tsp', name: 'Teaspoon (US)', symbol: 'tsp', ratio: 4.9289e-6 },
            { id: 'bbl_oil', name: 'Barrel (Oil)', symbol: 'bbl', ratio: 0.158987 },
        ]
    },
    {
        id: 'Mass',
        name: 'Mass & Weight',
        icon: <Scale className="w-5 h-5" />,
        baseUnit: 'Kilogram',
        units: [
            { id: 'kg', name: 'Kilogram', symbol: 'kg', ratio: 1, base: true },
            { id: 'g', name: 'Gram', symbol: 'g', ratio: 0.001 },
            { id: 'mg', name: 'Milligram', symbol: 'mg', ratio: 1e-6 },
            { id: 't', name: 'Metric Ton', symbol: 't', ratio: 1000 },
            { id: 'lb', name: 'Pound', symbol: 'lb', ratio: 0.453592 },
            { id: 'oz', name: 'Ounce', symbol: 'oz', ratio: 0.0283495 },
            { id: 'st', name: 'Stone', symbol: 'st', ratio: 6.35029 },
            { id: 'ct', name: 'Carat', symbol: 'ct', ratio: 0.0002 },
        ]
    },
    {
        id: 'Speed',
        name: 'Speed',
        icon: <Timer className="w-5 h-5" />, // Timer fits nicely
        baseUnit: 'Meter per Second',
        units: [
            { id: 'mps', name: 'Meter per Second', symbol: 'm/s', ratio: 1, base: true },
            { id: 'kmh', name: 'Kilometer per Hour', symbol: 'km/h', ratio: 0.277778 },
            { id: 'mph', name: 'Mile per Hour', symbol: 'mph', ratio: 0.44704 },
            { id: 'kn', name: 'Knot', symbol: 'kn', ratio: 0.514444 },
            { id: 'mach', name: 'Mach', symbol: 'Ma', ratio: 343 }, // Approx at sea level
            { id: 'c', name: 'Speed of Light', symbol: 'c', ratio: 299792458 },
        ]
    },
    {
        id: 'Time',
        name: 'Time',
        icon: <Timer className="w-5 h-5" />,
        baseUnit: 'Second',
        units: [
            { id: 's', name: 'Second', symbol: 's', ratio: 1, base: true },
            { id: 'ms', name: 'Millisecond', symbol: 'ms', ratio: 0.001 },
            { id: 'us', name: 'Microsecond', symbol: 'µs', ratio: 1e-6 },
            { id: 'ns', name: 'Nanosecond', symbol: 'ns', ratio: 1e-9 },
            { id: 'min', name: 'Minute', symbol: 'min', ratio: 60 },
            { id: 'h', name: 'Hour', symbol: 'h', ratio: 3600 },
            { id: 'd', name: 'Day', symbol: 'd', ratio: 86400 },
            { id: 'wk', name: 'Week', symbol: 'wk', ratio: 604800 },
            { id: 'mo', name: 'Month (Avg)', symbol: 'mo', ratio: 2.628e6 }, // 30.44 days
            { id: 'yr', name: 'Year (Julian)', symbol: 'yr', ratio: 3.15576e7 }, // 365.25 days
        ]
    },
    {
        id: 'Temperature',
        name: 'Temperature',
        icon: <CloudLightning className="w-5 h-5" />,
        baseUnit: 'Kelvin',
        units: [
            // Temperature is special due to offsets. Ratio is relative to Kelvin unit size (which is same as Celsius).
            { id: 'K', name: 'Kelvin', symbol: 'K', ratio: 1, offset: 0, base: true },
            { id: 'C', name: 'Celsius', symbol: '°C', ratio: 1, offset: 273.15 },
            { id: 'F', name: 'Fahrenheit', symbol: '°F', ratio: 5 / 9, offset: 459.67 }, // (K * 9/5) - 459.67 = F  -> (F + 459.67) * 5/9 = K.  Wait, handling this logic in the convert function is safer.
        ]
    },
    {
        id: 'Energy',
        name: 'Energy',
        icon: <Zap className="w-5 h-5" />,
        baseUnit: 'Joule',
        units: [
            { id: 'J', name: 'Joule', symbol: 'J', ratio: 1, base: true },
            { id: 'kJ', name: 'Kilojoule', symbol: 'kJ', ratio: 1000 },
            { id: 'cal', name: 'Calorie (Therm)', symbol: 'cal', ratio: 4.184 },
            { id: 'kcal', name: 'Kilocalorie', symbol: 'kcal', ratio: 4184 },
            { id: 'wh', name: 'Watt-hour', symbol: 'Wh', ratio: 3600 },
            { id: 'kwh', name: 'Kilowatt-hour', symbol: 'kWh', ratio: 3.6e6 },
            { id: 'ev', name: 'Electronvolt', symbol: 'eV', ratio: 1.60218e-19 },
            { id: 'btu', name: 'BTU (ISO)', symbol: 'BTU', ratio: 1055.06 },
        ]
    },
    {
        id: 'Power',
        name: 'Power',
        icon: <Zap className="w-5 h-5" />,
        baseUnit: 'Watt',
        units: [
            { id: 'W', name: 'Watt', symbol: 'W', ratio: 1, base: true },
            { id: 'kW', name: 'Kilowatt', symbol: 'kW', ratio: 1000 },
            { id: 'MW', name: 'Megawatt', symbol: 'MW', ratio: 1e6 },
            { id: 'hp', name: 'Horsepower (Mech)', symbol: 'hp', ratio: 745.7 },
        ]
    },
    {
        id: 'Pressure',
        name: 'Pressure',
        icon: <CloudLightning className="w-5 h-5" />,
        baseUnit: 'Pascal',
        units: [
            { id: 'Pa', name: 'Pascal', symbol: 'Pa', ratio: 1, base: true },
            { id: 'kPa', name: 'Kilopascal', symbol: 'kPa', ratio: 1000 },
            { id: 'bar', name: 'Bar', symbol: 'bar', ratio: 100000 },
            { id: 'psi', name: 'PSI', symbol: 'psi', ratio: 6894.76 },
            { id: 'atm', name: 'Atmosphere', symbol: 'atm', ratio: 101325 },
            { id: 'torr', name: 'Torr', symbol: 'Torr', ratio: 133.322 },
        ]
    },
    {
        id: 'Data',
        name: 'Data Storage',
        icon: <Database className="w-5 h-5" />,
        baseUnit: 'Bit',
        units: [
            { id: 'b', name: 'Bit', symbol: 'b', ratio: 1, base: true },
            { id: 'B', name: 'Byte', symbol: 'B', ratio: 8 },
            { id: 'KB', name: 'Kilobyte (Decimal)', symbol: 'KB', ratio: 8000 },
            { id: 'MB', name: 'Megabyte (Decimal)', symbol: 'MB', ratio: 8e6 },
            { id: 'GB', name: 'Gigabyte (Decimal)', symbol: 'GB', ratio: 8e9 },
            { id: 'TB', name: 'Terabyte (Decimal)', symbol: 'TB', ratio: 8e12 },
            { id: 'KiB', name: 'Kibibyte (Binary)', symbol: 'KiB', ratio: 8 * 1024 },
            { id: 'MiB', name: 'Mebibyte (Binary)', symbol: 'MiB', ratio: 8 * 1024 * 1024 },
            { id: 'GiB', name: 'Gibibyte (Binary)', symbol: 'GiB', ratio: 8 * 1024 * 1024 * 1024 },
            { id: 'TiB', name: 'Tebibyte (Binary)', symbol: 'TiB', ratio: 8 * 1024 * 1024 * 1024 * 1024 },
        ]
    },
    {
        id: 'Angle',
        name: 'Angle',
        icon: <Globe className="w-5 h-5" />,
        baseUnit: 'Degree',
        units: [
            { id: 'deg', name: 'Degree', symbol: '°', ratio: 1, base: true },
            { id: 'rad', name: 'Radian', symbol: 'rad', ratio: 57.2958 },
            { id: 'grad', name: 'Gradian', symbol: 'grad', ratio: 0.9 },
            { id: 'arcmin', name: 'Arcminute', symbol: '′', ratio: 1 / 60 },
            { id: 'arcsec', name: 'Arcsecond', symbol: '″', ratio: 1 / 3600 },
        ]
    },
    {
        id: 'Frequency',
        name: 'Frequency',
        icon: <Zap className="w-5 h-5" />,
        baseUnit: 'Hertz',
        units: [
            { id: 'Hz', name: 'Hertz', symbol: 'Hz', ratio: 1, base: true },
            { id: 'kHz', name: 'Kilohertz', symbol: 'kHz', ratio: 1000 },
            { id: 'MHz', name: 'Megahertz', symbol: 'MHz', ratio: 1e6 },
            { id: 'GHz', name: 'Gigahertz', symbol: 'GHz', ratio: 1e9 },
            { id: 'rpm', name: 'RPM', symbol: 'rpm', ratio: 1 / 60 },
        ]
    }
];

const ProUnitConverter: React.FC = () => {
    // --- State ---
    const [selectedCategory, setSelectedCategory] = useState<CategoryDef>(CATEGORIES[0]);
    const [fromUnitId, setFromUnitId] = useState<string>(CATEGORIES[0].units[0].id);
    const [toUnitId, setToUnitId] = useState<string>(CATEGORIES[0].units[1].id);
    const [inputValue, setInputValue] = useState<string>('1');
    const [precision, setPrecision] = useState<number>(4);
    const [scientificMode, setScientificMode] = useState<boolean>(false);
    const [history, setHistory] = useState<ConversionHistoryItem[]>([]);

    // Derived units based on selection
    const fromUnit = selectedCategory.units.find(u => u.id === fromUnitId) || selectedCategory.units[0];
    const toUnit = selectedCategory.units.find(u => u.id === toUnitId) || selectedCategory.units[1];

    // --- Conversion Logic ---

    // Handle special cases specifically (Temperature)
    const convert = (val: number, from: UnitDef, to: UnitDef): number => {
        if (selectedCategory.id === 'Temperature') {
            let k = val;
            // Convert to Kelvin
            if (from.id === 'C') k = val + 273.15;
            else if (from.id === 'F') k = (val + 459.67) * 5 / 9;
            else k = val; // Kelvin

            // Convert from Kelvin
            if (to.id === 'C') return k - 273.15;
            if (to.id === 'F') return k * 9 / 5 - 459.67;
            return k; // Kelvin
        }

        // Standard Ratio Conversion
        const baseVal = val * from.ratio;
        return baseVal / to.ratio;
    };

    const resultValue = useMemo(() => {
        const val = parseFloat(inputValue);
        if (isNaN(val)) return '---';

        const res = convert(val, fromUnit, toUnit);

        if (scientificMode || Math.abs(res) > 1e9 || (Math.abs(res) < 1e-6 && res !== 0)) {
            return res.toExponential(precision);
        }

        // Handle floating point precision errors slightly
        return Number(res.toFixed(precision + 2)).toLocaleString('en-US', {
            maximumFractionDigits: precision,
            minimumFractionDigits: 0
        });
    }, [inputValue, fromUnit, toUnit, precision, scientificMode, selectedCategory]);

    const formula = useMemo(() => {
        if (selectedCategory.id === 'Temperature') {
            if (fromUnit.id === 'C' && toUnit.id === 'F') return `(°C × 9/5) + 32 = °F`;
            if (fromUnit.id === 'F' && toUnit.id === 'C') return `(°F − 32) × 5/9 = °C`;
            // Simplified return for others
            return `${fromUnit.symbol} ↔ ${toUnit.symbol}`;
        }
        const factor = fromUnit.ratio / toUnit.ratio;
        const factorStr = factor < 0.001 || factor > 1000 ? factor.toExponential(4) : factor.toPrecision(5);
        return `Multiply by ${factorStr}`;
    }, [fromUnit, toUnit, selectedCategory]);

    // --- Side Effects ---

    // History log
    useEffect(() => {
        const val = parseFloat(inputValue);
        if (isNaN(val) || !resultValue || resultValue === '---') return;

        const timer = setTimeout(() => {
            setHistory(prev => {
                const newItem: ConversionHistoryItem = {
                    id: Date.now().toString(),
                    fromVal: inputValue,
                    fromUnit: fromUnit.symbol,
                    toVal: resultValue,
                    toUnit: toUnit.symbol,
                    category: selectedCategory.id,
                    timestamp: Date.now()
                };
                return [newItem, ...prev].slice(0, 10);
            });
        }, 2000); // Only log after 2s of inactivity

        return () => clearTimeout(timer);
    }, [inputValue, fromUnitId, toUnitId]);

    // --- Handlers ---

    const handleCategoryChange = (cat: CategoryDef) => {
        setSelectedCategory(cat);
        setFromUnitId(cat.units[0].id);
        setToUnitId(cat.units[1]?.id || cat.units[0].id);
    };

    const handleSwap = () => {
        setFromUnitId(toUnitId);
        setToUnitId(fromUnitId);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400 backdrop-blur-md">
                            <Calculator className="w-8 h-8" />
                        </div>
                        Professional Converter
                    </h2>
                    <p className="text-gray-400 mt-1">Accurate, standards-based unit conversion across {CATEGORIES.length} domains.</p>
                </div>

                <div className="flex items-center bg-black/20 p-1 rounded-xl border border-white/5 backdrop-blur-sm">
                    <button
                        onClick={() => setScientificMode(false)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!scientificMode
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Standard
                    </button>
                    <button
                        onClick={() => setScientificMode(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${scientificMode
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Scientific
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Left: Categories */}
                <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group border border-transparent ${selectedCategory.id === cat.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'hover:bg-white/10 text-gray-400 hover:text-white border-transparent hover:border-white/5'
                                }`}
                        >
                            <div className={`transition-colors ${selectedCategory.id === cat.id ? 'text-white' : 'text-gray-500 group-hover:text-blue-400'}`}>
                                {cat.icon}
                            </div>
                            <span className="font-medium">{cat.name}</span>
                            <ChevronRight className={`w-4 h-4 ml-auto opacity-50 transition-transform ${selectedCategory.id === cat.id ? 'text-white translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                        </button>
                    ))}
                </div>

                {/* Center: Conversion Workspace */}
                <div className="lg:col-span-3 space-y-6">

                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 lg:p-8">

                        {/* Input Group */}
                        <div className="grid md:grid-cols-7 gap-4 items-center mb-8">

                            {/* FROM */}
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider ml-1">From</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => {
                                            if (e.target.value === '' || /^-?\d*\.?\d*(e-?\d*)?$/.test(e.target.value)) {
                                                setInputValue(e.target.value);
                                            }
                                        }}
                                        className="w-full text-3xl font-bold text-white bg-black/30 border-2 border-transparent focus:border-blue-500/50 rounded-2xl px-4 py-4 transition-all outline-none font-mono placeholder-gray-600"
                                        placeholder="0"
                                    />
                                </div>
                                <GlassSelect
                                    value={fromUnitId}
                                    onChange={(val) => setFromUnitId(val)}
                                    options={selectedCategory.units.map(u => ({ value: u.id, label: `${u.name} (${u.symbol})` }))}
                                    className="w-full"
                                />
                            </div>

                            {/* Swap Button */}
                            <div className="md:col-span-1 flex justify-center pt-8">
                                <button
                                    onClick={handleSwap}
                                    className="p-3 bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded-full transition-all active:scale-95 border border-white/10 hover:border-blue-500/30"
                                >
                                    <ArrowRightLeft className="w-6 h-6" />
                                </button>
                            </div>

                            {/* TO */}
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider ml-1">To</label>
                                <div className="relative group">
                                    <div className="w-full text-3xl font-bold text-blue-400 bg-blue-500/10 border-2 border-blue-500/20 rounded-2xl px-4 py-4 overflow-hidden flex items-center justify-between font-mono">
                                        <span className="truncate">{resultValue}</span>
                                        <button
                                            onClick={() => copyToClipboard(resultValue)}
                                            className="opacity-0 group-hover:opacity-100 transition-all ml-2 p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 active:scale-95"
                                            title="Copy result"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <GlassSelect
                                    value={toUnitId}
                                    onChange={(val) => setToUnitId(val)}
                                    options={selectedCategory.units.map(u => ({ value: u.id, label: `${u.name} (${u.symbol})` }))}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Controls & Formula */}
                        <div className="bg-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5">
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                    <Info className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="font-medium">Formula:</span>
                                <span className="font-mono bg-black/30 px-3 py-1 rounded-lg border border-white/10 text-gray-200">{formula}</span>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto bg-black/20 px-4 py-2 rounded-xl border border-white/5">
                                <span className="text-sm font-medium text-gray-400 whitespace-nowrap">Precision: <span className="text-white font-mono">{precision}</span></span>
                                <input
                                    type="range"
                                    min="0"
                                    max="12"
                                    value={precision}
                                    onChange={(e) => setPrecision(Number(e.target.value))}
                                    className="w-full md:w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                        </div>

                    </div>

                    {/* History */}
                    {history.length > 0 && (
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    <History className="w-4 h-4 text-blue-400" /> Recent Conversions
                                </h3>
                                <button
                                    onClick={() => setHistory([])}
                                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-lg transition-colors border border-red-500/20"
                                >
                                    <Trash2 className="w-3 h-3" /> Clear History
                                </button>
                            </div>
                            <div className="space-y-2">
                                {history.map((item) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-sm border border-transparent hover:border-white/10">
                                        <div className="flex items-center gap-2 font-medium">
                                            <span className="text-white font-mono">{item.fromVal} <span className="text-gray-500 text-xs">{item.fromUnit}</span></span>
                                            <ArrowRightLeft className="w-3 h-3 text-gray-500" />
                                            <span className="text-blue-400 font-mono">{item.toVal} <span className="text-gray-500 text-xs">{item.toUnit}</span></span>
                                        </div>
                                        <span className="text-xs text-gray-500 mt-1 sm:mt-0 px-2 py-1 bg-black/20 rounded border border-white/5">
                                            {CATEGORIES.find(c => c.id === item.category)?.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProUnitConverter;
