interface RoleCardProps {
   icon: string | React.ReactNode;
   title: string;
   description: string;
   role: 'athlete' | 'coach';
   onSelect: (role: 'athlete' | 'coach') => void;
   disabled?: boolean;
}

export const RoleCard: React.FC<RoleCardProps> = ({
    icon,
    title,
    description,
    role,
    onSelect,
    disabled = false
   }) => {
   return (
     <button
       className="role-card"
       onClick={() => onSelect(role)}
       disabled={disabled}
       aria-label={`Select ${title} role`}
     >
        <div className="role-icon">{icon}</div>
        <h3 className="role-title">{title}</h3>
        <p className="role-description">{description}</p>
     </button>
   );
};
