import logoAgency from '../img/logo_agency.png';

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
} as const;

type AppLogoProps = {
  size?: keyof typeof sizeClasses;
  showText?: boolean;
  className?: string;
};

export function AppLogo({ size = 'md', showText = false, className = '' }: AppLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logoAgency}
        alt="Agency 360"
        className={`${sizeClasses[size]} shrink-0 object-contain`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tighter text-slate-900 leading-none uppercase">
            Agency
          </span>
          <span className="text-sm font-bold text-slate-400">360</span>
        </div>
      )}
    </div>
  );
}
