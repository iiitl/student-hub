'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type DropdownMenuProps = {
  title: string
  variable: string
  setVariable: React.Dispatch<React.SetStateAction<string>>
  variableArray: string[]
}

const PaperFilterDropdown: React.FC<DropdownMenuProps> = ({
  title,
  variable,
  setVariable,
  variableArray,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{variable || 'None'}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={variable} onValueChange={setVariable}>
          {variableArray.length === 0 ? (
            <DropdownMenuLabel className="text-muted-foreground">
              No options available
            </DropdownMenuLabel>
          ) : (
            variableArray.map((item) => (
              <DropdownMenuRadioItem key={item} value={item}>
                {item}
              </DropdownMenuRadioItem>
            ))
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default PaperFilterDropdown
