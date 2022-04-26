import getTargets from './targets'

const main = async () => {
  const targets = await getTargets()
  console.log(targets)
}

main()
