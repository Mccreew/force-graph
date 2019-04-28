import { link } from 'fs';

import * as _ from "lodash/lang";

/**
 * 得到一个节点有多少条边
 * @param {*} nodeId node的id
 * @param {*} links 所有的边
 */
function getLinkCount(nodeId, links) {
    let count = 0
    links.forEach(l => {
        if (l.source.id == nodeId || l.target.id == nodeId) {
            count += 1
        }
    });
    return count
}

/**
 * node是否有和targetNode以外的边的联系
 * @param {*} nodeId 
 * @param {*} links 
 * @param {*} targetNodeId 
 */
function hasAnotherLink(nodeId, links, targetNodeId) {
    let flag = false
    for (let i = 0; i < links.length; i++) {
        const l = links[i];
        if (l.source.id == nodeId && l.target.id != targetNodeId || l.source.id != targetNodeId && l.target.id == nodeId) {
            flag = true
            return flag
        }
    }
    return flag
}

/**
 * 设置边的曲率
 * @param {*} links 
 */
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
        let baseLink = localLinks[i]
        for (let j = 0; j < localLinks.length; j++) {
            let compareLink = localLinks[j]
            if (!compareLink) {
                continue
            }
            if (_.default.isEqual(compareLink.source, baseLink.source) && _.default.isEqual(compareLink.target, baseLink.target)) {
                tempLinks.push(compareLink)
            }
        }
        // 相同source和target的边不止有一条
        if (tempLinks.length > 1) {
            multyLinks.push(tempLinks)

            localLinks.forEach((ll, i) => {
                for (let j = 0; j < tempLinks.length; j++) {
                    if (_.default.isEqual(ll, tempLinks[j])) {
                        delete localLinks[i]
                    }
                }
            })

            // localLinks = localLinks.filter(l => {
            //     for (let i = 0; i < tempLinks.length; i++) {
            //         const tl = tempLinks[i];
            //         if (_.default.isEqual(l, tl))
            //             return false
            //     }
            //     return true
            // })
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
}

export { getLinkCount, hasAnotherLink, setLinkCurvature }