importScripts('./lodash.js')

function setLinkCurvature(data) {
  // 复制本地数组
  let localLinks = [...data.links]
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
  multyLinks.forEach(linkArr => {
    if (linkArr.length % 2 == 0) {
      linkArr.forEach((l, i) => {
        if (i < linkArr.length / 2) {
          l.curvature = (i + 1) * (1 / linkArr.length)
        } else {
          l.curvature = -(linkArr.length - i) * (1 / linkArr.length)
        }
      })
    } else {
      linkArr.forEach((l, i) => {
        if (i < Math.floor(linkArr.length / 2)) {
          l.curvature = (i + 1) * (1 / (linkArr.length - 1))
        } else if (i > Math.floor(linkArr.length / 2)) {
          l.curvature = -(linkArr.length - i) * (1 / (linkArr.length - 1))
        } else {
          l.curvature = 0
        }
      })
    }
  })

  return data
}

function setMainCategoty(data){
  data.nodes.forEach(n => {
    if(!n.mainCategory){
      n.mainCategory = n.categorys[0]
    }
  })
}
this.addEventListener('message', e => {
  let newData = setLinkCurvature(e.data)
  setMainCategoty(newData)
  postMessage(newData)
})