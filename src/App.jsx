import React, { useState, useRef, useEffect } from 'react';
import { Search, BookOpen, X, RefreshCw } from 'lucide-react';

// ID вашої Google Таблиці
const SHEET_ID = '1VFlHbVJEwH4Us0xdUSmH7JCfzJJI04rseWUD1JRh90A';

// Посилання для експорту Google Таблиці у форматі JSON
const GOOGLE_SHEETS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

const LANGUAGES = [
  { code: 'ua', label: 'Українська', flag: '🇺🇦' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export default function App() {
  const [termsData, setTermsData] = useState([]);
  const [sourceLang, setSourceLang] = useState('ua');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchRef = useRef(null);

  // Завантаження даних із Google Sheets при запуску
  useEffect(() => {
    fetchTermsFromGoogleSheets();
  }, []);

  const fetchTermsFromGoogleSheets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(GOOGLE_SHEETS_URL);
      const text = await response.text();

      // Очищення відповіді Google
      const jsonData = JSON.parse(text.substring(47, text.length - 2));
      const rows = jsonData.table.rows;

      // Парсинг рядків Google Таблиці (en, es, ua)
      const parsedTerms = rows
        .map((row, index) => {
          const c = row.c;
          return {
            id: index.toString(),
            en: c[0] ? c[0].v : '',
            es: c[1] ? c[1].v : '',
            ua: c[2] ? c[2].v : '',
          };
        })
        .filter((item) => item.en || item.es || item.ua);

      setTermsData(parsedTerms);
    } catch (err) {
      console.error('Помилка завантаження даних:', err);
      setError('Не вдалося завантажити словник. Перевірте доступ до Google Таблиці.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedTerm(null);

    if (!val.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const filtered = termsData
      .filter((item) =>
        item[sourceLang]?.toString().toLowerCase().includes(val.toLowerCase())
      )
      .slice(0, 6);

    setSuggestions(filtered);
    setShowDropdown(true);
  };

  const handleSelectTerm = (term) => {
    setSelectedTerm(term);
    setQuery(term[sourceLang]);
    setShowDropdown(false);
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedTerm(null);
    setSuggestions([]);
  };

  const targetLangs = LANGUAGES.filter((l) => l.code !== sourceLang);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center p-4 md:p-8">
      <header className="max-w-2xl w-full text-center my-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold tracking-tight">Термінологічний Словник</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Швидкий пошук та переклад термінів (EN / ES / UA)
        </p>
      </header>

      <main className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-6">
        {/* Статус завантаження або помилки */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-blue-600 text-sm py-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Завантаження словника з Google Таблиці...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs text-center border border-red-100">
            {error}
          </div>
        )}

        {/* Вибір мови оригіналу */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wider">
            Мова оригіналу
          </label>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setSourceLang(lang.code);
                  setSelectedTerm(null);
                  setQuery('');
                  setSuggestions([]);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                  sourceLang === lang.code
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Поле введення */}
        <div className="relative" ref={searchRef}>
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => query.trim() && setShowDropdown(true)}
              disabled={loading}
              placeholder={`Введіть термін (${LANGUAGES.find((l) => l.code === sourceLang)?.label})...`}
              className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base transition-all disabled:opacity-50"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Випадаючий список підказок */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectTerm(item)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-50 last:border-none flex justify-between items-center group transition-colors"
                >
                  <span className="font-medium text-slate-700 group-hover:text-blue-600">
                    {item[sourceLang]}
                  </span>
                  <span className="text-xs text-slate-400 flex gap-2">
                    {targetLangs.map((tl) => (
                      <span key={tl.code} className="bg-slate-100 px-1.5 py-0.5 rounded">
                        {tl.flag} {item[tl.code]}
                      </span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Результати перекладу */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Переклад іншими мовами
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {targetLangs.map((lang) => (
              <div
                key={lang.code}
                className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between min-h-[100px]"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                  <span>{lang.flag}</span>
                  <span>{lang.label.toUpperCase()}</span>
                </div>
                <div className="text-lg font-semibold text-slate-800">
                  {selectedTerm ? (
                    selectedTerm[lang.code]
                  ) : (
                    <span className="text-slate-300 font-normal italic">
                      Оберіть або введіть слово
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="mt-8 text-xs text-slate-400 text-center flex items-center gap-2">
        <span>Синхронізовано з Google Таблицею</span>
        <button
          onClick={fetchTermsFromGoogleSheets}
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Оновити
        </button>
      </footer>
    </div>
  );
}
