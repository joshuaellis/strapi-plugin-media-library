import * as React from "react";
import styled from "styled-components";
import { AccessibleIcon } from "./AccessibleIcon";

interface IconButtonProps {
  children: React.ReactNode;
  className?: string;
  label: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, className, label, onClick, disabled }, ref) => {
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <Button
        ref={ref}
        className={className}
        type="button"
        onClick={handleClick}
        aria-disabled={disabled}
      >
        <AccessibleIcon label={label}>{children}</AccessibleIcon>
      </Button>
    );
  }
);

const Button = styled.button`
  padding: 5px;
  border: none;
  background: transparent;
  color: #fafafa;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: filter 200ms ease-out;

  & > svg {
    width: 20px;
  }

  &[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not([aria-disabled="true"]):hover {
    filter: brightness(70%);
  }
`;
