const URL_REGEX = /(https?:\/\/[^\s<>"]+)/g

type Props = {
  text: string
  className?: string
  preserveNewlines?: boolean
}

export default function LinkifiedText({ text, className, preserveNewlines = false }: Props) {
  const parts = text.split(URL_REGEX)

  const nodes = parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 underline hover:text-indigo-800 break-all"
        >
          {part}
        </a>
      )
    }
    if (preserveNewlines) {
      return part.split('\n').map((line, j, arr) => (
        <span key={`${i}-${j}`}>
          {line}
          {j < arr.length - 1 && <br />}
        </span>
      ))
    }
    return part
  })

  return <span className={className}>{nodes}</span>
}
