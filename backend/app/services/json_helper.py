"""JSON 处理工具类"""
import json
import re
from typing import Any, Dict, List, Union
from app.logger import get_logger

logger = get_logger(__name__)


def clean_json_response(text: str) -> str:
    """清洗 AI 返回的 JSON（改进版 - 流式安全，增强修复能力）"""
    try:
        if not text:
            logger.warning("⚠️ clean_json_response: 输入为空")
            return text
        
        original_length = len(text)
        logger.debug(f"🔍 开始清洗JSON，原始长度: {original_length}")
        
        # 去除 markdown 代码块
        text = re.sub(r'^```json\s*\n?', '', text, flags=re.MULTILINE | re.IGNORECASE)
        text = re.sub(r'^```\s*\n?', '', text, flags=re.MULTILINE)
        text = re.sub(r'\n?```\s*$', '', text, flags=re.MULTILINE)
        text = text.strip()
        
        if len(text) != original_length:
            logger.debug(f"   移除markdown后长度: {len(text)}")
        
        # 尝试直接解析（快速路径）
        try:
            json.loads(text)
            logger.debug(f"✅ 直接解析成功，无需清洗")
            return text
        except:
            pass
        
        # 找到第一个 { 或 [
        start = -1
        for i, c in enumerate(text):
            if c in ('{', '['):
                start = i
                break
        
        if start == -1:
            logger.warning(f"⚠️ 未找到JSON起始符号 {{ 或 [")
            logger.debug(f"   文本预览: {text[:200]}")
            return text
        
        if start > 0:
            logger.debug(f"   跳过前{start}个字符")
            text = text[start:]
        
        # 改进的括号匹配算法（更严格的字符串处理）
        stack = []
        i = 0
        end = -1
        in_string = False
        
        while i < len(text):
            c = text[i]
            
            # 处理字符串状态
            if c == '"':
                if not in_string:
                    # 进入字符串
                    in_string = True
                else:
                    # 检查是否是转义的引号
                    num_backslashes = 0
                    j = i - 1
                    while j >= 0 and text[j] == '\\':
                        num_backslashes += 1
                        j -= 1
                    
                    # 偶数个反斜杠表示引号未被转义，字符串结束
                    if num_backslashes % 2 == 0:
                        in_string = False
                
                i += 1
                continue
            
            # 在字符串内部，跳过所有字符
            if in_string:
                i += 1
                continue
            
            # 处理括号（只有在字符串外部才有效）
            if c == '{' or c == '[':
                stack.append(c)
            elif c == '}':
                if len(stack) > 0 and stack[-1] == '{':
                    stack.pop()
                    if len(stack) == 0:
                        end = i + 1
                        logger.debug(f"✅ 找到JSON结束位置: {end}")
                        break
                elif len(stack) > 0:
                    # 括号不匹配，可能是损坏的JSON，尝试继续
                    logger.warning(f"⚠️ 括号不匹配：遇到 }} 但栈顶是 {stack[-1]}")
                else:
                    # 栈为空遇到 }，忽略多余的闭合括号
                    logger.warning(f"⚠️ 遇到多余的 }}，忽略")
            elif c == ']':
                if len(stack) > 0 and stack[-1] == '[':
                    stack.pop()
                    if len(stack) == 0:
                        end = i + 1
                        logger.debug(f"✅ 找到JSON结束位置: {end}")
                        break
                elif len(stack) > 0:
                    # 括号不匹配，可能是损坏的JSON，尝试继续
                    logger.warning(f"⚠️ 括号不匹配：遇到 ] 但栈顶是 {stack[-1]}")
                else:
                    # 栈为空遇到 ]，忽略多余的闭合括号
                    logger.warning(f"⚠️ 遇到多余的 ]，忽略")
            
            i += 1
        
        # 检查未闭合的字符串
        if in_string:
            logger.warning(f"⚠️ 字符串未闭合，JSON可能不完整")
        
        # 提取结果
        if end > 0:
            result = text[:end]
            logger.debug(f"✅ JSON清洗完成，结果长度: {len(result)}")
        else:
            result = text
            logger.warning(f"⚠️ 未找到JSON结束位置，返回全部内容（长度: {len(result)}）")
            logger.debug(f"   栈状态: {stack}")
            
            # ⭐ 新增：尝试修复未闭合的 JSON
            if stack:
                result = _try_fix_unclosed_json(result, stack, in_string)
        
        # 验证清洗后的结果
        try:
            json.loads(result)
            logger.debug(f"✅ 清洗后JSON验证成功")
        except json.JSONDecodeError as e:
            logger.error(f"❌ 清洗后JSON仍然无效: {e}")
            logger.debug(f"   结果预览: {result[:500]}")
            logger.debug(f"   结果结尾: ...{result[-200:]}")
            
            # ⭐ 新增：尝试更激进的修复
            result = _try_aggressive_fix(result)
        
        return result
        
    except Exception as e:
        logger.error(f"❌ clean_json_response 出错: {e}")
        logger.error(f"   文本长度: {len(text) if text else 0}")
        logger.error(f"   文本预览: {text[:200] if text else 'None'}")
        raise


def _try_fix_unclosed_json(text: str, stack: List[str], in_string: bool) -> str:
    """
    尝试修复未闭合的 JSON
    
    Args:
        text: 原始文本
        stack: 未闭合的括号栈
        in_string: 是否在字符串内部
    
    Returns:
        修复后的文本
    """
    logger.info(f"🔧 尝试修复未闭合的JSON，栈深度: {len(stack)}, 在字符串中: {in_string}")
    
    result = text
    
    # 如果在字符串内部，先闭合字符串
    if in_string:
        result += '"'
        logger.debug(f"   添加闭合引号")
    
    # 按照栈的逆序添加闭合括号
    while stack:
        bracket = stack.pop()
        if bracket == '{':
            result += '}'
            logger.debug(f"   添加闭合 }}")
        elif bracket == '[':
            result += ']'
            logger.debug(f"   添加闭合 ]")
    
    # 验证修复结果
    try:
        json.loads(result)
        logger.info(f"✅ 修复成功！")
        return result
    except json.JSONDecodeError as e:
        logger.warning(f"⚠️ 简单修复失败: {e}")
        return text  # 返回原始文本


def _try_aggressive_fix(text: str) -> str:
    """
    尝试更激进的 JSON 修复策略
    
    Args:
        text: 原始文本
    
    Returns:
        修复后的文本
    """
    logger.info(f"🔧 尝试激进修复策略...")
    
    # 策略1：修复常见的 JSON 错误（优先尝试）
    result = _fix_common_errors(text)
    try:
        json.loads(result)
        logger.info(f"✅ 策略1（修复常见错误）成功！")
        return result
    except:
        pass
    
    # 策略2：移除尾部不完整的内容
    result = _fix_trailing_content(text)
    try:
        json.loads(result)
        logger.info(f"✅ 策略2（移除尾部内容）成功！")
        return result
    except:
        pass
    
    # 策略3：尝试修复缺少逗号的问题
    result = _fix_missing_commas(text)
    try:
        json.loads(result)
        logger.info(f"✅ 策略3（修复缺少逗号）成功！")
        return result
    except:
        pass
    
    # 策略4：尝试提取有效的 JSON 对象
    result = _extract_valid_json(text)
    if result:
        try:
            json.loads(result)
            logger.info(f"✅ 策略4（提取有效JSON）成功！")
            return result
        except:
            pass
    
    logger.warning(f"⚠️ 所有修复策略都失败，返回原始文本")
    return text


def _fix_trailing_content(text: str) -> str:
    """移除尾部不完整的内容"""
    # 找到最后一个完整的键值对或数组元素
    
    # 尝试找到最后一个有效的闭合位置
    for i in range(len(text) - 1, -1, -1):
        if text[i] in ('}', ']'):
            # 尝试从这个位置截断
            candidate = text[:i+1]
            try:
                json.loads(candidate)
                return candidate
            except:
                continue
    
    return text


def _fix_common_errors(text: str) -> str:
    """修复常见的 JSON 错误"""
    result = text
    
    # 1. 移除尾部多余的逗号（在 } 或 ] 之前）
    result = re.sub(r',\s*([}\]])', r'\1', result)
    
    # 2. 修复缺少逗号的情况（在 } 或 ] 后面紧跟 { 或 [ 或 "）
    result = re.sub(r'([}\]])(\s*)([{\[""])', r'\1,\2\3', result)
    
    # 3. 修复字符串值后面缺少逗号的情况（"value" 后面紧跟 "key"）
    # 匹配: "..." 空白 "..." 但不是 "...": 的情况
    result = re.sub(r'("(?:[^"\\]|\\.)*")(\s+)("(?:[^"\\]|\\.)*"\s*:)', r'\1,\2\3', result)
    
    # 4. 修复数字/布尔值/null后面缺少逗号的情况
    # 匹配: 数字/true/false/null 空白 "key":
    result = re.sub(r'(\d+|true|false|null)(\s+)("(?:[^"\\]|\\.)*"\s*:)', r'\1,\2\3', result)
    
    # 5. 移除控制字符（保留换行和制表符）
    result = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', result)
    
    # 6. 修复字符串内部的未转义换行符
    result = _fix_unescaped_newlines_in_strings(result)
    
    return result


def _fix_missing_commas(text: str) -> str:
    """
    专门修复缺少逗号分隔符的问题
    
    这是一个更精确的修复方法，逐字符分析 JSON 结构
    """
    result = []
    i = 0
    in_string = False
    last_value_end = -1  # 上一个值结束的位置
    
    while i < len(text):
        c = text[i]
        
        # 处理字符串
        if c == '"':
            if not in_string:
                # 检查是否需要在字符串前添加逗号
                if last_value_end >= 0:
                    # 检查从上一个值结束到当前位置之间是否有逗号
                    between = ''.join(result[last_value_end:])
                    if between.strip() and ',' not in between and ':' not in between:
                        # 需要添加逗号
                        result.append(',')
                        logger.debug(f"   在位置 {i} 添加缺少的逗号")
                in_string = True
            else:
                # 检查是否是转义的引号
                num_backslashes = 0
                j = len(result) - 1
                while j >= 0 and result[j] == '\\':
                    num_backslashes += 1
                    j -= 1
                
                if num_backslashes % 2 == 0:
                    in_string = False
                    # 记录字符串结束位置（在添加当前字符之后）
                    last_value_end = len(result) + 1
        
        # 处理数字、布尔值、null 的结束
        elif not in_string and c in ' \t\n\r':
            if result and result[-1] not in ' \t\n\r,:[{':
                # 可能是一个值的结束
                last_value_end = len(result)
        
        # 处理 } 和 ]
        elif not in_string and c in '}]':
            last_value_end = -1  # 重置
        
        # 处理 { 和 [
        elif not in_string and c in '{[':
            if last_value_end >= 0:
                between = ''.join(result[last_value_end:])
                if between.strip() and ',' not in between and ':' not in between:
                    result.append(',')
                    logger.debug(f"   在位置 {i} 添加缺少的逗号（在 {c} 之前）")
            last_value_end = -1
        
        result.append(c)
        i += 1
    
    return ''.join(result)


def _fix_unescaped_newlines_in_strings(text: str) -> str:
    """
    修复字符串内部未转义的换行符
    
    JSON 字符串中不允许有未转义的换行符
    """
    result = []
    i = 0
    in_string = False
    
    while i < len(text):
        c = text[i]
        
        if c == '"':
            if not in_string:
                in_string = True
            else:
                # 检查是否是转义的引号
                num_backslashes = 0
                j = len(result) - 1
                while j >= 0 and result[j] == '\\':
                    num_backslashes += 1
                    j -= 1
                
                if num_backslashes % 2 == 0:
                    in_string = False
            result.append(c)
        elif in_string and c == '\n':
            # 在字符串内部遇到换行符，转义它
            result.append('\\n')
        elif in_string and c == '\r':
            # 在字符串内部遇到回车符，转义它
            result.append('\\r')
        elif in_string and c == '\t':
            # 在字符串内部遇到制表符，转义它
            result.append('\\t')
        else:
            result.append(c)
        
        i += 1
    
    return ''.join(result)


def _extract_valid_json(text: str) -> str:
    """尝试提取有效的 JSON 对象"""
    # 尝试找到一个完整的 JSON 对象
    
    # 方法1：从头开始，逐步减少长度
    for end in range(len(text), 0, -1):
        candidate = text[:end]
        try:
            json.loads(candidate)
            return candidate
        except:
            continue
    
    # 方法2：尝试找到嵌套的有效 JSON
    # 查找所有可能的 JSON 起始位置
    starts = [i for i, c in enumerate(text) if c in ('{', '[')]
    
    for start in starts:
        for end in range(len(text), start, -1):
            candidate = text[start:end]
            try:
                json.loads(candidate)
                return candidate
            except:
                continue
    
    return None


def parse_json(text: str) -> Union[Dict, List]:
    """解析 JSON"""
    cleaned = None
    try:
        cleaned = clean_json_response(text)
        return json.loads(cleaned)
    except Exception as e:
        logger.error(f"❌ parse_json 出错: {e}")
        logger.error(f"   原始文本长度: {len(text) if text else 0}")
        logger.error(f"   清洗后文本长度: {len(cleaned) if cleaned else 0}")
        raise