const semver = require('semver')

function findClosestSemverMatch(semverString, semverStringArray) {
  if (!semverStringArray.length) {
    return null
  }

  const sortedSemvers = semver.sort(semverStringArray)
  const offsets = sortedSemvers.map(semverA => {
    const parsedSemverA = semver(semverA)
    const parsedSemverB = semver(semverString)

    return Math.abs(
      (parsedSemverA.major * 100 + parsedSemverA.minor * 10 + parsedSemverA.patch) -
      (parsedSemverB.major * 100 + parsedSemverB.minor * 10 + parsedSemverB.patch)
    )
  })

  const minOffset = Math.min.apply(null, offsets)
  return sortedSemvers[offsets.indexOf(minOffset)]
}

module.exports = findClosestSemverMatch