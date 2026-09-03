import { Center, Loader } from '@mantine/core'

export function RouteFallback() {
  return (
    <Center h="100vh">
      <Loader />
    </Center>
  )
}
