type Props = {
  isFetching: boolean;
};

export function FetchingIndicator({ isFetching }: Props) {
  return (
    <div
      className={`h-[2px] w-full rounded-full bg-brand transition-opacity duration-300 ease-out ${
        isFetching ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    />
  );
}
