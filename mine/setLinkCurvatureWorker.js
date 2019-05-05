importScripts('./lodash.js')

function setLinkCurvature(links) {
  // 复制本地数组
  let localLinks = [...links]
  // 筛选出多个拥有同一source和target的边
  let multyLinks = []


  for (let i = 0; i < localLinks.length; i++) {
    // 跳过已有curvature的边
    if (!localLinks[i] || localLinks[i].curvature) {
      continue
    }
    // 相同source，target的一组边
    let tempLinks = []
    let { source, target } = localLinks[i]
    let baseLink = {
      source_id: typeof (source) == 'object' ? source.id : source,
      target_id: typeof (target) == 'object' ? target.id : target
    }
    for (let j = 0; j < localLinks.length; j++) {
      if (!localLinks[j]) {
        continue
      }
      let { source, target } = localLinks[j]
      let compareLink = {
        source_id: typeof (source) == 'object' ? source.id : source,
        target_id: typeof (target) == 'object' ? target.id : target
      }
      if (!compareLink) {
        continue
      }
      if (_.isEqual(compareLink, baseLink)) {
        tempLinks.push(localLinks[j])
      }
    }
    // 相同source和target的边不止有一条
    if (tempLinks.length > 1) {
      multyLinks.push(tempLinks)

      localLinks.forEach((ll, i) => {
        for (let j = 0; j < tempLinks.length; j++) {
          if (_.isEqual(ll, tempLinks[j])) {
            delete localLinks[i]
          }
        }
      })
    }
  }
  multyLinks.forEach(links => {
    if (links.length % 2 == 0) {
      links.forEach((l, i) => {
        if (i < links.length / 2) {
          l.curvature = (i + 1) * (1 / links.length)
        } else {
          l.curvature = -(links.length - i) * (1 / links.length)
        }
      })
    } else {
      links.forEach((l, i) => {
        if (i < Math.floor(links.length / 2)) {
          l.curvature = (i + 1) * (1 / (links.length - 1))
        } else if (i > Math.floor(links.length / 2)) {
          l.curvature = -(links.length - i) * (1 / (links.length - 1))
        } else {
          l.curvature = 0
        }
      })
    }
  })

  return links
}

this.addEventListener('message', e => {
  let newLinks = setLinkCurvature(e.data)
  postMessage(newLinks)
})