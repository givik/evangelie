
import { DropdownMenu } from 'radix-ui';
const DropdownMenuDemo = () => {

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button >
          MENU
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content sideOffset={5}>
          <DropdownMenu.Item>
            New Tab 1
          </DropdownMenu.Item>
          <DropdownMenu.Item>
            New Tab 2
          </DropdownMenu.Item>
          <DropdownMenu.Item>
            New Tab 3
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default DropdownMenuDemo;
