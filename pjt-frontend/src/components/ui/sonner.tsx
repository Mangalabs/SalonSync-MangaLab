import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    toastOptions={{
      classNames: {
        toast:
            'group toast group-[.toaster]:bg-[#F5F5F0] group-[.toaster]:text-[#2C2C2C] group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-[#737373]',
        actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton:
            'group-[.toast]:bg-[#F0F0EB] group-[.toast]:text-[#737373]',
      },
    }}
    {...props}
  />
)

export { Toaster }