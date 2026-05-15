import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

const COMMON_SKILLS = [
  // Frontend
  'React', 'Vue.js', 'Angular', 'Next.js', 'Svelte', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'SASS',
  // Backend
  'Node.js', 'Python', 'Java', 'Go', 'Rust', 'C#', 'C++', 'PHP', 'Ruby', 'Kotlin', 'Swift',
  'FastAPI', 'Django', 'Flask', 'Express.js', 'Spring Boot', 'Laravel', 'NestJS', 'Ruby on Rails',
  // Database
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Elasticsearch', 'DynamoDB', 'Cassandra',
  // Cloud & DevOps
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'GitHub Actions', 'Jenkins',
  // Data & AI
  'SQL', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Tableau', 'Power BI', 'R',
  // Tools
  'Git', 'GitHub', 'JIRA', 'Figma', 'REST APIs', 'GraphQL', 'Microservices', 'Agile', 'Scrum',
  // Mobile
  'React Native', 'Flutter', 'iOS', 'Android',
  // Microsoft
  'Excel', 'Word', 'PowerPoint', 'SharePoint', 'Power Automate', '.NET',
];

interface SkillsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  maxSkills?: number;
}

const SkillsInput: React.FC<SkillsInputProps> = ({
  value,
  onChange,
  placeholder = 'Add skills...',
  maxSkills = 20,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = COMMON_SKILLS.filter(
    (s) =>
      !value.includes(s) &&
      s.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 8);

  // Show either filtered suggestions or all unselected skills (first 8)
  const suggestions = inputValue
    ? filtered
    : COMMON_SKILLS.filter((s) => !value.includes(s)).slice(0, 8);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || value.includes(trimmed) || value.length >= maxSkills) return;
    onChange([...value, trimmed]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const removeSkill = (skill: string) => {
    onChange(value.filter((s) => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeSkill(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`min-h-[42px] w-full px-3 py-2 border rounded-lg flex flex-wrap gap-1.5 cursor-text transition-colors ${
          focused ? 'border-accent ring-2 ring-accent/20' : 'border-gray-300'
        }`}
        onClick={() => { inputRef.current?.focus(); setDropdownOpen(true); }}
      >
        {value.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-xs font-medium"
          >
            {skill}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeSkill(skill); }}
              className="hover:text-red-500 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <div className="flex items-center flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setDropdownOpen(true); }}
            onKeyDown={handleKeyDown}
            onFocus={() => { setFocused(true); setDropdownOpen(true); }}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 outline-none text-sm bg-transparent text-gray-800 placeholder-gray-400 min-w-[80px]"
          />
          <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
        </div>
      </div>

      {/* Dropdown */}
      {dropdownOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {inputValue && !COMMON_SKILLS.includes(inputValue.trim()) && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addSkill(inputValue)}
              className="w-full px-3 py-2 text-left text-sm text-accent hover:bg-accent/5 border-b border-gray-100 flex items-center gap-2"
            >
              <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">+ Add</span>
              "{inputValue.trim()}"
            </button>
          )}
          {suggestions.map((skill) => (
            <button
              key={skill}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addSkill(skill)}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between group"
            >
              {skill}
              <span className="text-xs text-gray-400 group-hover:text-accent">+ Add</span>
            </button>
          ))}
        </div>
      )}
      <p className="mt-1 text-xs text-gray-400">
        Type to search, press Enter or comma to add. Custom skills allowed.
      </p>
    </div>
  );
};

export default SkillsInput;
